import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters'],
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [300, 'Summary cannot exceed 300 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'answered', 'closed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  suggestedSkills: {
    type: [String],
    default: [],
    validate: {
      validator: function(skills) {
        return skills.length <= 10;
      },
      message: 'Cannot have more than 10 suggested skills',
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  responses: [{
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [3000, 'Response cannot exceed 3000 characters'],
    },
    isAnswer: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  viewCount: {
    type: Number,
    default: 0,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  votedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vote: {
      type: String,
      enum: ['up', 'down'],
    },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
QuestionSchema.index({ author: 1, createdAt: -1 });
QuestionSchema.index({ assignedTo: 1, status: 1 });
QuestionSchema.index({ status: 1, priority: -1, createdAt: -1 });
QuestionSchema.index({ suggestedSkills: 1 });
QuestionSchema.index({ tags: 1 });

// Virtual for response count
QuestionSchema.virtual('responseCount').get(function() {
  return this.responses.length;
});

// Virtual for answered status
QuestionSchema.virtual('hasAnswer').get(function() {
  return this.responses.some(response => response.isAnswer);
});

// Static method to find questions by skill
QuestionSchema.statics.findBySkills = function(skills, status = null) {
  const query = { suggestedSkills: { $in: skills } };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('author', 'name email').populate('assignedTo', 'name email');
};

// Static method to find questions assigned to a moderator
QuestionSchema.statics.findAssignedTo = function(moderatorId, status = null) {
  const query = { assignedTo: moderatorId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('author', 'name email')
    .sort({ updatedAt: -1 });
};

// Static method to find pending questions for assignment
QuestionSchema.statics.findPendingQuestions = function() {
  return this.find({ status: 'pending' })
    .populate('author', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

// Method to assign question to moderator
QuestionSchema.methods.assignToModerator = function(moderatorId) {
  this.assignedTo = moderatorId;
  this.status = 'assigned';
  return this.save();
};

// Method to add response
QuestionSchema.methods.addResponse = function(moderatorId, content, isAnswer = false) {
  this.responses.push({
    moderator: moderatorId,
    content,
    isAnswer,
  });
  
  if (isAnswer) {
    this.status = 'answered';
  } else if (this.status === 'assigned') {
    this.status = 'in-progress';
  }
  
  return this.save();
};

// Method to vote on question
QuestionSchema.methods.vote = function(userId, voteType) {
  // Remove existing vote from this user
  this.votedBy = this.votedBy.filter(vote => !vote.user.equals(userId));
  
  // Add new vote
  this.votedBy.push({ user: userId, vote: voteType });
  
  // Recalculate vote counts
  const votes = this.votedBy.reduce((acc, vote) => {
    if (vote.vote === 'up') acc.upvotes++;
    else acc.downvotes++;
    return acc;
  }, { upvotes: 0, downvotes: 0 });
  
  this.upvotes = votes.upvotes;
  this.downvotes = votes.downvotes;
  
  return this.save();
};

// Pre-save middleware to generate summary if not provided
QuestionSchema.pre('save', async function(next) {
  if (this.isNew && !this.summary) {
    try {
      const { generateQuestionSummary } = await import('../lib/gemini.js');
      // Pass both content and title to generate better summary
      this.summary = await generateQuestionSummary(this.content, this.title);
      console.log('✅ AI-generated summary:', this.summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      // Better fallback summary using title and content
      if (this.title && this.content) {
        const combinedText = `${this.title}. ${this.content}`;
        this.summary = combinedText.length > 150 ? 
          combinedText.substring(0, 147) + '...' : 
          combinedText;
      } else {
        this.summary = this.content.length > 150 ? 
          this.content.substring(0, 147) + '...' : 
          this.content;
      }
    }
  }
  next();
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

export default Question;
