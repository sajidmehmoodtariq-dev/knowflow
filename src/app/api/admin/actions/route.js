import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Question } from '@/models/Question'
import { User } from '@/models/User'
import { auth } from '@/../auth'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    const { action, questionId, moderatorId, data } = await request.json()

    switch (action) {
      case 'assign-question':
        return await handleAssignQuestion(questionId, moderatorId)
      
      case 'escalate-question':
        return await handleEscalateQuestion(questionId, data?.reason)
      
      case 'close-question':
        return await handleCloseQuestion(questionId, data?.reason)
      
      case 'approve-moderator':
        return await handleApproveModerator(moderatorId)
      
      case 'reject-moderator':
        return await handleRejectModerator(moderatorId, data?.reason)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleAssignQuestion(questionId, moderatorId) {
  const question = await Question.findById(questionId)
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const moderator = await User.findById(moderatorId)
  if (!moderator || moderator.role !== 'moderator' || !moderator.approved) {
    return NextResponse.json({ error: 'Invalid moderator' }, { status: 400 })
  }

  question.assignedTo = moderatorId
  question.status = 'assigned'
  question.assignedAt = new Date()
  question.assignmentType = 'manual'
  await question.save()

  return NextResponse.json({
    success: true,
    message: 'Question assigned successfully',
    question: {
      id: question._id,
      title: question.title,
      assignedTo: moderator.name,
      status: question.status
    }
  })
}

async function handleEscalateQuestion(questionId, reason) {
  const question = await Question.findById(questionId)
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  question.status = 'escalated'
  question.escalatedAt = new Date()
  question.escalationReason = reason || 'Admin escalation'
  
  // Add escalation note to responses
  question.responses.push({
    content: `Question escalated by admin: ${reason || 'No reason provided'}`,
    author: null, // System message
    isSystemMessage: true,
    createdAt: new Date()
  })

  await question.save()

  return NextResponse.json({
    success: true,
    message: 'Question escalated successfully',
    question: {
      id: question._id,
      title: question.title,
      status: question.status
    }
  })
}

async function handleCloseQuestion(questionId, reason) {
  const question = await Question.findById(questionId)
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  question.status = 'closed'
  question.closedAt = new Date()
  question.closureReason = reason || 'Admin closure'

  // Add closure note to responses
  question.responses.push({
    content: `Question closed by admin: ${reason || 'No reason provided'}`,
    author: null, // System message
    isSystemMessage: true,
    createdAt: new Date()
  })

  await question.save()

  return NextResponse.json({
    success: true,
    message: 'Question closed successfully',
    question: {
      id: question._id,
      title: question.title,
      status: question.status
    }
  })
}

async function handleApproveModerator(moderatorId) {
  const moderator = await User.findById(moderatorId)
  if (!moderator || moderator.role !== 'moderator') {
    return NextResponse.json({ error: 'Invalid moderator' }, { status: 400 })
  }

  moderator.approved = true
  moderator.approvedAt = new Date()
  await moderator.save()

  return NextResponse.json({
    success: true,
    message: 'Moderator approved successfully',
    user: {
      id: moderator._id,
      name: moderator.name,
      email: moderator.email,
      approved: moderator.approved
    }
  })
}

async function handleRejectModerator(moderatorId, reason) {
  const moderator = await User.findById(moderatorId)
  if (!moderator || moderator.role !== 'moderator') {
    return NextResponse.json({ error: 'Invalid moderator' }, { status: 400 })
  }

  // Convert back to regular user
  moderator.role = 'user'
  moderator.approved = false
  moderator.rejectionReason = reason || 'Application rejected by admin'
  moderator.rejectedAt = new Date()
  await moderator.save()

  return NextResponse.json({
    success: true,
    message: 'Moderator application rejected',
    user: {
      id: moderator._id,
      name: moderator.name,
      email: moderator.email,
      role: moderator.role
    }
  })
}
