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
        endChapter: { type: Number },
        startVerse: { type: Number },
        endVerse: { type: Number }
      },
      newTestament: {
        book: { type: String, required: true },
        startChapter: { type: Number, required: true },
        endChapter: { type: Number },
        startVerse: { type: Number },
        endVerse: { type: Number }
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

  /** New fields for daily boost **/
  otPercentage: { type: Number, default: 0 }, // Old Testament percentage
  ntPercentage: { type: Number, default: 0 }, // New Testament percentage
  lastBoostDate: { type: Date }, // Last time we applied the boost

  // Notes field for storing user's notes on daily readings
  notes: [
    {
      verse: { type: String, trim: true },
      note: { type: String, required: true, trim: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  // Highlights field for storing user's verse highlights
  highlights: [
    {
      verse: { type: String, required: true, trim: true },
      verseText: { type: String, required: true, trim: true },
      book: { type: String, required: true, trim: true },
      chapter: { type: Number, required: true },
      color: {
        type: String,
        enum: ['yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'red'],
        default: 'yellow'
      },
      note: { type: String, trim: true },
      day: { type: Number, min: 1, max: 365 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Calculate progress percentage based on completed days
UserProgressSchema.methods.calculateProgress = function(totalDays = 365) {
  const completedDaysCount = this.completedDays.length;
  const percentage = (completedDaysCount / totalDays) * 100;
  return Math.round(percentage * 100) / 100;
};

// Method to get highlights by book
UserProgressSchema.methods.getHighlightsByBook = function(bookName) {
  return this.highlights.filter(highlight =>
    highlight.book.toLowerCase() === bookName.toLowerCase()
  );
};

// Method to get highlights by color
UserProgressSchema.methods.getHighlightsByColor = function(color) {
  return this.highlights.filter(highlight => highlight.color === color);
};

// Method to get highlights for a specific day
UserProgressSchema.methods.getHighlightsByDay = function(day) {
  return this.highlights.filter(highlight => highlight.day === day);
};

module.exports = mongoose.model('UserProgress', UserProgressSchema);
