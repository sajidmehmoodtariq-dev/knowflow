import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Question from '@/models/Question';
import { analyzeQuestionForSkills } from '@/lib/gemini';
import { autoAssignQuestion } from '@/lib/question-routing';

export async function GET(request) {
  try {
    await connectDB();

    // Get sample data for testing
    const moderators = await User.find({
      role: 'moderator',
      approved: true,
      verified: true,
    }).select('name email skills').limit(5);

    const allSkills = [...new Set(moderators.flatMap(mod => mod.skills))];
    
    const pendingQuestions = await Question.find({ status: 'pending' })
      .populate('author', 'name email')
      .limit(3);

    // Test AI analysis on a sample question
    let aiTestResult = null;
    if (pendingQuestions.length > 0) {
      const sampleQuestion = pendingQuestions[0];
      try {
        const suggestedSkills = await analyzeQuestionForSkills(
          `${sampleQuestion.title} ${sampleQuestion.content}`,
          allSkills
        );
        aiTestResult = {
          questionId: sampleQuestion._id,
          title: sampleQuestion.title,
          allAvailableSkills: allSkills,
          aiSuggestedSkills: suggestedSkills,
        };
      } catch (error) {
        aiTestResult = { error: error.message };
      }
    }

    return NextResponse.json({
      success: true,
      system_status: {
        totalModerators: moderators.length,
        approvedModerators: moderators.length,
        totalSkills: allSkills.length,
        pendingQuestions: pendingQuestions.length,
        geminiApiConfigured: !!process.env.GOOGLE_GEMINI_API_KEY,
      },
      moderators: moderators.map(mod => ({
        id: mod._id,
        name: mod.name,
        email: mod.email,
        skills: mod.skills,
      })),
      available_skills: allSkills,
      pending_questions: pendingQuestions.map(q => ({
        id: q._id,
        title: q.title,
        author: q.author?.name,
        suggestedSkills: q.suggestedSkills,
        status: q.status,
      })),
      ai_test_result: aiTestResult,
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, questionId } = await request.json();

    await connectDB();

    if (action === 'test-assignment' && questionId) {
      // Test auto-assignment on a specific question
      const result = await autoAssignQuestion(questionId);
      
      // Get updated question to verify assignment
      const updatedQuestion = await Question.findById(questionId)
        .populate('author', 'name email')
        .populate('assignedTo', 'name email');

      return NextResponse.json({
        success: true,
        assignment_result: result,
        updated_question: {
          id: updatedQuestion._id,
          title: updatedQuestion.title,
          status: updatedQuestion.status,
          suggestedSkills: updatedQuestion.suggestedSkills,
          author: updatedQuestion.author,
          assignedTo: updatedQuestion.assignedTo,
        },
      });
    }

    if (action === 'test-ai-analysis') {
      const { title, content } = await request.json();
      
      if (!title || !content) {
        return NextResponse.json(
          { error: 'Title and content are required for AI analysis test' },
          { status: 400 }
        );
      }

      // Get all available skills
      const moderators = await User.find({
        role: 'moderator',
        approved: true,
        verified: true,
      }).select('skills');

      const allSkills = [...new Set(moderators.flatMap(mod => mod.skills))];

      // Test AI skill analysis
      const suggestedSkills = await analyzeQuestionForSkills(
        `${title} ${content}`,
        allSkills
      );

      // Test AI summary generation
      const { generateQuestionSummary } = await import('@/lib/gemini');
      const aiSummary = await generateQuestionSummary(content, title);

      return NextResponse.json({
        success: true,
        input: { title, content },
        available_skills: allSkills,
        ai_suggested_skills: suggestedSkills,
        ai_generated_summary: aiSummary,
        analysis_method: process.env.GOOGLE_GEMINI_API_KEY ? 'Gemini AI' : 'Keyword Fallback',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "test-assignment" or "test-ai-analysis"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test POST API error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
