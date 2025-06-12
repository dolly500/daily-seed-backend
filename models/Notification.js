// models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['reminder', 'progress', 'achievement'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedDay: {
    type: Number,
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true, // adds createdAt and updatedAt
});

module.exports = mongoose.model('Notification', notificationSchema);