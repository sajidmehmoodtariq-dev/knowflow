import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth.js';
import { verifyToken } from '@/lib/auth-middleware';
import { 
  autoAssignQuestion, 
  getRoutingStats, 
  processPendingQuestions,
  findStaleQuestions 
} from '@/lib/question-routing';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Check user permissions (admin or moderator) - user is already loaded
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { action, questionId } = await request.json();

    switch (action) {
      case 'auto-assign':
        if (!questionId) {
          return NextResponse.json(
            { error: 'Question ID is required' },
            { status: 400 }
          );
        }

        const assignmentResult = await autoAssignQuestion(questionId);
        return NextResponse.json(assignmentResult);

      case 'process-pending':
        // Only admins can batch process
        if (user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        const processResult = await processPendingQuestions();
        return NextResponse.json(processResult);

      case 'find-stale':
        const hoursThreshold = parseInt(request.body?.hoursThreshold) || 24;
        const staleQuestions = await findStaleQuestions(hoursThreshold);
        
        return NextResponse.json({
          success: true,
          count: staleQuestions.length,
          questions: staleQuestions.map(q => ({
            id: q._id,
            title: q.title,
            status: q.status,
            author: q.author,
            assignedTo: q.assignedTo,
            updatedAt: q.updatedAt,
            hoursSinceUpdate: Math.floor((Date.now() - new Date(q.updatedAt)) / (1000 * 60 * 60)),
          })),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Routing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Check user permissions - user is already loaded
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get routing statistics
    const stats = await getRoutingStats();
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch routing statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Routing stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
