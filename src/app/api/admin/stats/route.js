import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Question from '@/models/Question';
import { auth } from '@/../auth.js';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    // Check authentication - try JWT token first, then NextAuth session
    let user = null;
    let userId = null;

    // Try JWT token authentication first
    const { user: tokenUser, error: tokenError } = await verifyToken(request);
    if (tokenUser) {
      user = tokenUser;
      userId = tokenUser._id;
    } else {
      // Fall back to NextAuth session
      const session = await auth();
      if (session?.user) {
        await connectDB();
        user = await User.findById(session.user.id);
        userId = session.user.id;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    // Check admin permissions - user is already loaded
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get comprehensive statistics
    const [
      userStats,
      questionStats,
      moderatorStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Question statistics
      Question.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Moderator performance
      User.aggregate([
        {
          $match: {
            role: 'moderator',
            approved: true,
            verified: true
          }
        },
        {
          $lookup: {
            from: 'questions',
            localField: '_id',
            foreignField: 'assignedTo',
            as: 'assignedQuestions'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            skills: 1,
            totalAssigned: { $size: '$assignedQuestions' },
            activeQuestions: {
              $size: {
                $filter: {
                  input: '$assignedQuestions',
                  cond: { $in: ['$$this.status', ['assigned', 'in-progress']] }
                }
              }
            },
            completedQuestions: {
              $size: {
                $filter: {
                  input: '$assignedQuestions',
                  cond: { $in: ['$$this.status', ['answered', 'closed']] }
                }
              }
            }
          }
        }
      ]),

      // Recent activity
      Promise.all([
        User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
        Question.find({}).sort({ createdAt: -1 }).limit(5).populate('author', 'name email').lean()
      ])
    ]);

    // Process user statistics
    const usersByRole = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Process question statistics
    const questionsByStatus = questionStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Calculate totals
    const totalUsers = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);
    const totalQuestions = Object.values(questionsByStatus).reduce((sum, count) => sum + count, 0);
    const pendingApprovals = await User.countDocuments({ role: 'moderator', approved: false });

    const [recentUsers, recentQuestions] = recentActivity;

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          byRole: {
            admin: usersByRole.admin || 0,
            moderator: usersByRole.moderator || 0,
            user: usersByRole.user || 0
          },
          pendingApprovals,
          verified: await User.countDocuments({ verified: true }),
          unverified: await User.countDocuments({ verified: false })
        },
        questions: {
          total: totalQuestions,
          byStatus: {
            pending: questionsByStatus.pending || 0,
            assigned: questionsByStatus.assigned || 0,
            'in-progress': questionsByStatus['in-progress'] || 0,
            answered: questionsByStatus.answered || 0,
            closed: questionsByStatus.closed || 0
          }
        },
        moderators: moderatorStats,
        recentActivity: {
          users: recentUsers.map(user => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          })),
          questions: recentQuestions.map(question => ({
            id: question._id.toString(),
            title: question.title,
            author: question.author,
            status: question.status,
            createdAt: question.createdAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
