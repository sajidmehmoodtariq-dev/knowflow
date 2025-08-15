import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Question from '@/models/Question';
import User from '@/models/User';
import { auth } from '../../../../auth.js';
import { analyzeQuestionForSkills } from '@/lib/gemini';

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { title, content, tags = [] } = await request.json();

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content cannot exceed 5000 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user in database
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all available skills from approved moderators
    const moderators = await User.find({
      role: 'moderator',
      approved: true,
      verified: true,
    }).select('skills');

    const allSkills = [...new Set(moderators.flatMap(mod => mod.skills))];

    // Analyze question with AI to suggest skills
    const suggestedSkills = await analyzeQuestionForSkills(
      `${title} ${content}`,
      allSkills
    );

    // Create new question
    const question = new Question({
      title,
      content,
      author: session.user.id,
      suggestedSkills,
      tags: tags.slice(0, 10), // Limit tags
    });

    await question.save();

    // Populate author info for response
    await question.populate('author', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Question submitted successfully',
      question: {
        id: question._id,
        title: question.title,
        content: question.content,
        summary: question.summary,
        author: question.author,
        status: question.status,
        suggestedSkills: question.suggestedSkills,
        tags: question.tags,
        createdAt: question.createdAt,
      },
    });

  } catch (error) {
    console.error('Question submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const skill = searchParams.get('skill');
    const author = searchParams.get('author');

    await connectDB();

    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (skill) {
      query.suggestedSkills = { $in: [skill] };
    }
    
    if (author) {
      query.author = author;
    }

    // Get user to check if they can see all questions or just their own
    const user = await User.findById(session.user.id);
    if (user.role === 'user' && !author) {
      // Regular users can only see their own questions by default
      query.author = session.user.id;
    }

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('author', 'name email role')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      questions: questions.map(q => ({
        id: q._id,
        title: q.title,
        content: q.content,
        summary: q.summary,
        author: q.author,
        assignedTo: q.assignedTo,
        status: q.status,
        priority: q.priority,
        suggestedSkills: q.suggestedSkills,
        tags: q.tags,
        responseCount: q.responses.length,
        upvotes: q.upvotes,
        downvotes: q.downvotes,
        viewCount: q.viewCount,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
        limit,
      },
    });

  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
