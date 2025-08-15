import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Question from '@/models/Question';
import User from '@/models/User';
import { auth } from '../../../../../auth.js';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request, { params }) {
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

    const { id } = await params;
    const questionId = id;
    const { moderatorId, action } = await request.json();

    await connectDB();

    // Check user permissions (admin or moderator) - user is already loaded from authentication
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'assign':
        if (!moderatorId) {
          return NextResponse.json(
            { error: 'Moderator ID is required for assignment' },
            { status: 400 }
          );
        }

        // Verify moderator exists and is approved
        const moderator = await User.findById(moderatorId);
        if (!moderator || moderator.role !== 'moderator' || !moderator.approved) {
          return NextResponse.json(
            { error: 'Invalid or unapproved moderator' },
            { status: 400 }
          );
        }

        await question.assignToModerator(moderatorId);
        break;

      case 'unassign':
        question.assignedTo = null;
        question.status = 'pending';
        await question.save();
        break;

      case 'self-assign':
        // Allow moderators to assign questions to themselves
        if (user.role !== 'moderator') {
          return NextResponse.json(
            { error: 'Only moderators can self-assign questions' },
            { status: 403 }
          );
        }

        await question.assignToModerator(session.user.id);
        break;

      case 'close':
        question.status = 'closed';
        await question.save();
        break;

      case 'reopen':
        question.status = question.assignedTo ? 'assigned' : 'pending';
        await question.save();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Return updated question
    await question.populate([
      { path: 'author', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: `Question ${action}ed successfully`,
      question: {
        id: question._id,
        title: question.title,
        status: question.status,
        assignedTo: question.assignedTo,
        updatedAt: question.updatedAt,
      },
    });

  } catch (error) {
    console.error('Question assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
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

    const { id } = await params;
    const questionId = id;

    await connectDB();

    const question = await Question.findById(questionId)
      .populate('author', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('responses.moderator', 'name email role');

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only view their own questions unless they're moderators/admins
    if (user.role === 'user' && !question.author._id.equals(userId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment view count (but not for the author)
    if (!question.author._id.equals(userId)) {
      question.viewCount += 1;
      await question.save();
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question._id,
        title: question.title,
        content: question.content,
        summary: question.summary,
        author: question.author,
        assignedTo: question.assignedTo,
        status: question.status,
        priority: question.priority,
        suggestedSkills: question.suggestedSkills,
        tags: question.tags,
        responses: question.responses.map(response => ({
          id: response._id,
          content: response.content,
          isAnswer: response.isAnswer,
          author: response.moderator, // Map moderator to author for consistent frontend
          createdAt: response.createdAt,
        })),
        responseCount: question.responses.length,
        hasAnswer: question.hasAnswer,
        upvotes: question.upvotes,
        downvotes: question.downvotes,
        viewCount: question.viewCount,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    });

  } catch (error) {
    console.error('Question fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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

    const { id } = await params;
    const questionId = id;
    const updates = await request.json();

    await connectDB();

    // Check user permissions (admin or moderator) - user is already loaded from authentication
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        question[key] = updates[key];
      }
    });

    question.updatedAt = new Date();
    await question.save();

    // Return updated question
    const updatedQuestion = await Question.findById(questionId)
      .populate('author', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      question: {
        id: updatedQuestion._id,
        title: updatedQuestion.title,
        content: updatedQuestion.content,
        summary: updatedQuestion.summary,
        author: updatedQuestion.author,
        assignedTo: updatedQuestion.assignedTo,
        status: updatedQuestion.status,
        priority: updatedQuestion.priority,
        suggestedSkills: updatedQuestion.suggestedSkills,
        tags: updatedQuestion.tags,
        responseCount: updatedQuestion.responses?.length || 0,
        upvotes: updatedQuestion.upvotes,
        downvotes: updatedQuestion.downvotes,
        viewCount: updatedQuestion.viewCount,
        createdAt: updatedQuestion.createdAt,
        updatedAt: updatedQuestion.updatedAt,
      }
    });

  } catch (error) {
    console.error('Question update error:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}
