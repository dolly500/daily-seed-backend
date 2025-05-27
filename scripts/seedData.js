const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ReadingPlan = require('../models/ReadingPlan');
const BibleContent = require('../models/BibleContent');

// Load environment variables
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample reading plan data
const readingPlanData = {
  name: "One Year Bible Reading Plan",
  description: "Read through the entire Bible in one year, with daily readings from both Old and New Testaments.",
  totalDays: 365,
  readings: [
    {
      day: 1,
      oldTestament: {
        book: "Genesis",
        startChapter: 1,
        endChapter: 3
      },
      newTestament: {
        book: "Matthew",
        startChapter: 1,
        endChapter: 1
      }
    },
    {
      day: 2,
      oldTestament: {
        book: "Genesis",
        startChapter: 4,
        endChapter: 6
      },
      newTestament: {
        book: "Matthew",
        startChapter: 2,
        endChapter: 2
      }
    },
    {
      day: 3,
      oldTestament: {
        book: "Genesis",
        startChapter: 7,
        endChapter: 9
      },
      newTestament: {
        book: "Matthew",
        startChapter: 3,
        endChapter: 3
      }
    }
    // Add more days as needed
  ],
  isActive: true
};

// Sample Bible content data (abbreviated)
const bibleContentData = [
  {
    version: "KJV",
    testament: "Old Testament",
    book: "Genesis",
    chapter: 1,
    verseCount: 31,
    verses: [
      { verse: 1, text: "In the beginning God created the heaven and the earth." },
      { verse: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters." },
      // Add more verses
    ]
  },
  {
    version: "KJV",
    testament: "New Testament",
    book: "Matthew",
    chapter: 1,
    verseCount: 25,
    verses: [
      { verse: 1, text: "The book of the generation of Jesus Christ, the son of David, the son of Abraham." },
      { verse: 2, text: "Abraham begat Isaac; and Isaac begat Jacob; and Jacob begat Judas and his brethren;" },
      // Add more verses
    ]
  }
  // Add more chapters as needed
];

// Seed data function
const seedData = async () => {
  try {
    // Clear existing data
    await ReadingPlan.deleteMany();
    await BibleContent.deleteMany();
    
    // Insert new data
    await ReadingPlan.create(readingPlanData);
    await BibleContent.insertMany(bibleContentData);
    
    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Execute seed function
seedData();