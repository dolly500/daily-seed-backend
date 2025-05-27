const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentDay: {
    type: Number,
    default: 1
  },
  completedDays: [
    {
      day: { type: Number, required: true },
      completedAt: { type: Date, default: Date.now }
    }
  ],
  customReadings: [
    {
      day: { type: Number, required: true },
      oldTestament: {
        book: { type: String, required: true },
        startChapter: { type: Number, required: true },
        endChapter: { type: Number, required: true }
      },
      newTestament: {
        book: { type: String, required: true },
        startChapter: { type: Number, required: true },
        endChapter: { type: Number, required: true }
      }
    }
  ],
  startDate: {
    type: Date,
    default: Date.now
  },
  lastReadDate: Date,
  booksRead: [
    {
      testament: {
        type: String,
        enum: ['Old Testament', 'New Testament'],
        required: true
      },
      book: {
        type: String,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      chaptersRead: [Number]
    }
  ],
  totalBooksCompleted: {
    type: Number,
    default: 0
  },
  percentageComplete: {
    type: Number,
    default: 0
  },
  // Notes field for storing user's notes on daily readings
 notes: [
  {
    verse: {
      type: String,
      trim: true
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
]

}, { timestamps: true });



// Calculate progress percentage based on completed days
UserProgressSchema.methods.calculateProgress = function(totalDays = 365) {
  const completedDaysCount = this.completedDays.length;
  const percentage = (completedDaysCount / totalDays) * 100;
  return Math.round(percentage * 100) / 100;
};

module.exports = mongoose.model('UserProgress', UserProgressSchema);