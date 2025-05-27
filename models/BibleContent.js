const mongoose = require('mongoose');

const BibleContentSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: [true, 'Bible version is required'],
      enum: ['KJV', 'NIV', 'ESV', 'NASB', 'NLT', 'NKJV', 'CSB']
    },
    testament: {
      type: String,
      enum: ['Old Testament', 'New Testament'],
      required: true
    },
    book: {
      type: String,
      required: [true, 'Book name is required']
    },
    chapter: {
      type: Number,
      required: [true, 'Chapter number is required']
    },
    verseCount: {
      type: Number,
      required: [true, 'Verse count is required']
    },
    verses: [
      {
        verseNumber: {
          type: Number,
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient lookups
BibleContentSchema.index({ version: 1, book: 1, chapter: 1 });

module.exports = mongoose.model('BibleContent', BibleContentSchema);