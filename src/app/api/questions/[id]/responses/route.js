import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Question from '@/models/Question';
import User from '@/models/User';
import { auth } from '../../../../../../auth.js';
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
    const { content, isAnswer = false } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      );
    }

    if (content.length > 3000) {
      return NextResponse.json(
        { error: 'Response cannot exceed 3000 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // User is already loaded from authentication step above
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if question is closed
    if (question.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot respond to closed questions' },
        { status: 400 }
      );
    }

    // Add response to question
    await question.addResponse(userId, content, isAnswer);

    // Populate the question with updated data
    await question.populate([
      { path: 'author', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'responses.moderator', select: 'name email role' }
    ]);

    // Get the newly added response
    const newResponse = question.responses[question.responses.length - 1];

    return NextResponse.json({
      success: true,
      message: 'Response added successfully',
      response: {
        id: newResponse._id,
        content: newResponse.content,
        isAnswer: newResponse.isAnswer,
        author: newResponse.moderator, // Map moderator to author for consistent frontend
        createdAt: newResponse.createdAt,
      },
      question: {
        id: question._id,
        status: question.status,
        hasAnswer: question.hasAnswer,
        responseCount: question.responseCount,
      },
    });

  } catch (error) {
    console.error('Response submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
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
      .populate('responses.moderator', 'name email role')
      .select('responses author');

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user can view responses (all authenticated users can view) - user is already loaded from authentication
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      responses: question.responses.map(response => ({
        id: response._id,
        content: response.content,
        isAnswer: response.isAnswer,
        author: response.moderator, // Map moderator to author for consistent frontend
        createdAt: response.createdAt,
      })),
    });

  } catch (error) {
    console.error('Responses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
