import { connectDB } from './mongodb';
import Question from '@/models/Question';
import User from '@/models/User';
import { analyzeQuestionForSkills } from './gemini';

/**
 * Auto-assign questions to suitable moderators based on skills
 * @param {string} questionId - The question ID to assign
 * @returns {Promise<Object>} - Assignment result
 */
export async function autoAssignQuestion(questionId) {
  try {
    await connectDB();

    const question = await Question.findById(questionId);
    if (!question || question.status !== 'pending') {
      return { success: false, message: 'Question not found or not pending' };
    }

    // Find available moderators with matching skills
    const matchingModerators = await User.findAvailableModerators(question.suggestedSkills);

    if (matchingModerators.length === 0) {
      // Try to find any available moderator if no skill match
      const anyModerators = await User.findAvailableModerators();
      if (anyModerators.length === 0) {
        return { success: false, message: 'No available moderators found' };
      }
      
      // Assign to least busy moderator
      const leastBusy = await findLeastBusyModerator(anyModerators);
      await question.assignToModerator(leastBusy._id);
      
      return {
        success: true,
        message: 'Question assigned to available moderator (no skill match)',
        assignedTo: leastBusy,
      };
    }

    // Calculate moderator scores based on skill overlap and current workload
    const moderatorScores = await Promise.all(
      matchingModerators.map(async (moderator) => {
        const workload = await getCurrentWorkload(moderator._id);
        const skillMatch = calculateSkillMatch(moderator.skills, question.suggestedSkills);
        
        return {
          moderator,
          score: skillMatch / (workload + 1), // Higher skill match, lower workload = higher score
          skillMatch,
          workload,
        };
      })
    );

    // Sort by score (descending) and assign to best match
    moderatorScores.sort((a, b) => b.score - a.score);
    const bestModerator = moderatorScores[0].moderator;

    await question.assignToModerator(bestModerator._id);

    return {
      success: true,
      message: 'Question auto-assigned successfully',
      assignedTo: bestModerator,
      score: moderatorScores[0].score,
      skillMatch: moderatorScores[0].skillMatch,
      workload: moderatorScores[0].workload,
    };

  } catch (error) {
    console.error('Auto-assignment error:', error);
    return { success: false, message: 'Failed to auto-assign question' };
  }
}

/**
 * Calculate skill match percentage between moderator skills and question needs
 */
function calculateSkillMatch(moderatorSkills, questionSkills) {
  if (!questionSkills.length) return 0;
  
  const matches = questionSkills.filter(skill => 
    moderatorSkills.some(modSkill => 
      modSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(modSkill.toLowerCase())
    )
  );
  
  return matches.length / questionSkills.length;
}

/**
 * Get current workload for a moderator
 */
async function getCurrentWorkload(moderatorId) {
  const activeQuestions = await Question.countDocuments({
    assignedTo: moderatorId,
    status: { $in: ['assigned', 'in-progress'] },
  });
  
  return activeQuestions;
}

/**
 * Find the least busy moderator from a list
 */
async function findLeastBusyModerator(moderators) {
  const workloads = await Promise.all(
    moderators.map(async (moderator) => ({
      moderator,
      workload: await getCurrentWorkload(moderator._id),
    }))
  );
  
  workloads.sort((a, b) => a.workload - b.workload);
  return workloads[0].moderator;
}

/**
 * Get routing statistics for dashboard
 */
export async function getRoutingStats() {
  try {
    await connectDB();

    const [
      totalQuestions,
      pendingQuestions,
      assignedQuestions,
      answeredQuestions,
      moderatorStats
    ] = await Promise.all([
      Question.countDocuments(),
      Question.countDocuments({ status: 'pending' }),
      Question.countDocuments({ status: { $in: ['assigned', 'in-progress'] } }),
      Question.countDocuments({ status: 'answered' }),
      User.aggregate([
        {
          $match: {
            role: 'moderator',
            approved: true,
            verified: true,
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
            }
          }
        }
      ])
    ]);

    return {
      total: totalQuestions,
      pending: pendingQuestions,
      assigned: assignedQuestions,
      answered: answeredQuestions,
      closed: totalQuestions - pendingQuestions - assignedQuestions - answeredQuestions,
      moderators: moderatorStats,
      averageResponseTime: null, // TODO: Calculate if needed
    };

  } catch (error) {
    console.error('Stats fetch error:', error);
    return null;
  }
}

/**
 * Batch process pending questions for auto-assignment
 */
export async function processPendingQuestions() {
  try {
    await connectDB();

    const pendingQuestions = await Question.findPendingQuestions();
    const results = [];

    for (const question of pendingQuestions) {
      const result = await autoAssignQuestion(question._id);
      results.push({
        questionId: question._id,
        title: question.title,
        ...result,
      });
    }

    return {
      success: true,
      processed: results.length,
      results,
    };

  } catch (error) {
    console.error('Batch processing error:', error);
    return {
      success: false,
      message: 'Failed to process pending questions',
    };
  }
}

/**
 * Find questions that might need re-assignment (inactive for too long)
 */
export async function findStaleQuestions(hoursThreshold = 24) {
  try {
    await connectDB();

    const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const staleQuestions = await Question.find({
      status: { $in: ['assigned', 'in-progress'] },
      updatedAt: { $lt: threshold },
    })
    .populate('author', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ updatedAt: 1 });

    return staleQuestions;

  } catch (error) {
    console.error('Stale questions search error:', error);
    return [];
  }
}
