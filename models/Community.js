
// models/Community.js
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: [50, 'Community name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator'],
      default: 'member'
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 1000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
communitySchema.index({ name: 1 });
communitySchema.index({ createdBy: 1 });
communitySchema.index({ 'members.user': 1 });

// Virtual for member count
communitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is member
communitySchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to get user's role in community
communitySchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

module.exports = mongoose.model('Community', communitySchema);