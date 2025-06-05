const { validationResult } = require('express-validator');
const User = require('../models/User');
const BibleContent = require('../models/BibleContent');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const READING_PLAN_DATA = require('../scripts/readingPlan');
const axios = require('axios');
const NodeCache = require('node-cache'); 


// @desc    Initialize user reading progress
// @route   POST /api/reading/init
// @access  Private
exports.initUserProgress = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if progress already exists
    let existingProgress = await UserProgress.findOne({ user: req.user.id });
    if (existingProgress) {
      return res.status(400).json({ success: false, message: 'Reading progress already exists' });
    }

    // Create initial progress document with a full year of readings
    const customReadings = generateYearlyReadings(); // Helper function to generate 365 days

    const newProgress = new UserProgress({
      user: req.user.id,
      currentDay: 1,
      booksRead: [
        { testament: 'Old Testament', book: 'Genesis', completed: false, chaptersRead: [] },
        { testament: 'New Testament', book: 'Matthew', completed: false, chaptersRead: [] }
      ],
      customReadings: customReadings,
      completedDays: [],
      totalBooksCompleted: 0,
      percentageComplete: 0,
      startDate: new Date()
    });

    await newProgress.save();

    return res.status(201).json({
      success: true,
      message: 'User reading progress initialized',
      progress: newProgress
    });
  } catch (error) {
    console.error('Error initializing user progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get reading for a specific date (calendar selection)
// @route   GET /api/reading/day/:year/:month/:day
// @access  Private
exports.getReadingByDay = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { year, month, day } = req.params;

    // Validate date parameters
    const requestedDate = new Date(year, month - 1, day);
    if (isNaN(requestedDate.getTime()) || 
        parseInt(day) < 1 || 
        parseInt(day) > new Date(year, month, 0).getDate()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameters'
      });
    }

    const user = await User.findById(req.user.id).populate('preferredBibleVersion');
    const bibleVersion = user.preferredBibleVersion || 'KJV';

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Calculate days since start date
    const daysSinceStart = Math.floor(
      (requestedDate - userProgress.startDate) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Calculate effective reading day (cycling through 365-day plan)
    let effectiveReadingDay = daysSinceStart;
    if (daysSinceStart < 1) {
      effectiveReadingDay = 365 + (daysSinceStart % 365);
      if (effectiveReadingDay <= 0) effectiveReadingDay = 365;
    } else if (daysSinceStart > 365) {
      effectiveReadingDay = ((daysSinceStart - 1) % 365) + 1;
    }

    // Validate effective reading day
    if (effectiveReadingDay < 1 || effectiveReadingDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading day calculated'
      });
    }

    // Find the reading for the effective day
    const dayReading = userProgress.customReadings?.find(
      (r) => r.day === effectiveReadingDay
    );

    if (!dayReading) {
      return res.status(404).json({
        success: false,
        message: `Reading not found for day ${effectiveReadingDay}`
      });
    }

    // Check if this day is completed
    const isCompleted = userProgress.completedDays.some(
      (completedDay) => completedDay.day === effectiveReadingDay
    );

    // Fetch content from Bible API
    const [otContent, ntContent] = await Promise.all([
      fetchBibleContent(
        dayReading.oldTestament.book,
        dayReading.oldTestament.startChapter,
        dayReading.oldTestament.endChapter,
        bibleVersion
      ),
      fetchBibleContent(
        dayReading.newTestament.book,
        dayReading.newTestament.startChapter,
        dayReading.newTestament.endChapter,
        bibleVersion
      ),
    ]);

    return res.status(200).json({
      success: true,
      reading: {
        day: effectiveReadingDay,
        date: requestedDate,
        isCompleted: isCompleted,
        oldTestament: {
          book: dayReading.oldTestament.book,
          startChapter: dayReading.oldTestament.startChapter,
          endChapter: dayReading.oldTestament.endChapter,
          content: otContent.verses,
          reference: otContent.reference,
          translation: otContent.translation,
          ...(otContent.error && { error: otContent.error }),
        },
        newTestament: {
          book: dayReading.newTestament.book,
          startChapter: dayReading.newTestament.startChapter,
          endChapter: dayReading.newTestament.endChapter,
          content: ntContent.verses,
          reference: ntContent.reference,
          translation: ntContent.translation,
          ...(ntContent.error && { error: ntContent.error }),
        },
      },
    });
  } catch (error) {
    console.error('Error in getReadingByDay:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};




// Helper function to generate a full year of Bible readings
function generateYearlyReadings() {
  if (!READING_PLAN_DATA || !Array.isArray(READING_PLAN_DATA) || READING_PLAN_DATA.length === 0) {
    throw new Error('Invalid or empty reading plan data');
  }
  
  // Transform and validate the data
  return READING_PLAN_DATA.map((reading, index) => {
    // Validate required fields
    if (!reading.day || !reading.oldTestament || !reading.newTestament) {
      throw new Error(`Invalid reading structure at index ${index}`);
    }
    
    // Ensure all required fields exist
    const transformedReading = {
      day: reading.day,
      oldTestament: {
        book: reading.oldTestament.book,
        startChapter: reading.oldTestament.startChapter,
        // If endChapter is missing, use startChapter
        endChapter: reading.oldTestament.endChapter || reading.oldTestament.startChapter
      },
      newTestament: {
        book: reading.newTestament.book,
        startChapter: reading.newTestament.startChapter,
        // If endChapter is missing, use startChapter  
        endChapter: reading.newTestament.endChapter || reading.newTestament.startChapter
      }
    };
    
    // Preserve verse information if it exists
    if (reading.oldTestament.startVerse) {
      transformedReading.oldTestament.startVerse = reading.oldTestament.startVerse;
    }
    if (reading.oldTestament.endVerse) {
      transformedReading.oldTestament.endVerse = reading.oldTestament.endVerse;
    }
    if (reading.newTestament.startVerse) {
      transformedReading.newTestament.startVerse = reading.newTestament.startVerse;
    }
    if (reading.newTestament.endVerse) {
      transformedReading.newTestament.endVerse = reading.newTestament.endVerse;
    }
    
    return transformedReading;
  });
}

// Helper function to calculate date from reading day
function calculateDateFromDay(startDate, day) {
  const resultDate = new Date(startDate);
  resultDate.setDate(resultDate.getDate() + day - 1);
  return resultDate;
}


// Helper function to fetch Bible content from Bible API
const fetchBibleContent = async (book, startChapter, endChapter, version = 'kjv', maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const chapterRange = endChapter && endChapter !== startChapter 
        ? `${startChapter}-${endChapter}` 
        : startChapter.toString();
      
      const reference = `${book}+${chapterRange}`;
      
      const response = await axios.get(`https://bible-api.com/${reference}`, {
        params: {
          translation: version.toLowerCase()
        },
        timeout: 10000
      });

      if (response.data && response.data.verses) {
        return {
          verses: response.data.verses.map(verse => ({
            verse: verse.verse,
            text: verse.text.trim()
          })),
          reference: response.data.reference,
          translation: response.data.translation_name
        };
      }

      return { verses: [], reference: '', translation: '' };
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${book} ${startChapter}-${endChapter}:`, error.message);
      
      // If last attempt, return error response
      if (attempt === maxRetries) {
        return { 
          verses: [], 
          reference: `${book} ${startChapter}${endChapter && endChapter !== startChapter ? `-${endChapter}` : ''}`,
          translation: version.toUpperCase(),
          error: `Failed after ${maxRetries} attempts: ${error.message}` 
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};


// @desc    Get all available Bible versions
// @route   GET /api/reading/bible-versions
// @access  Private
exports.getBibleVersions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Common Bible versions with their API codes
    const bibleVersions = [
      {
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'English',
        year: 1611,
        description: 'Traditional English translation'
      },
      {
        id: 'web',
        name: 'World English Bible',
        abbreviation: 'WEB',
        language: 'English',
        year: 2000,
        description: 'Public domain modern English translation'
      },
      {
        id: 'net',
        name: 'New English Translation',
        abbreviation: 'NET',
        language: 'English',
        year: 2005,
        description: 'Contemporary English with extensive notes'
      },
      {
        id: 'nasb',
        name: 'New American Standard Bible',
        abbreviation: 'NASB',
        language: 'English',
        year: 1995,
        description: 'Literal translation for study'
      },
      {
        id: 'niv',
        name: 'New International Version',
        abbreviation: 'NIV',
        language: 'English',
        year: 2011,
        description: 'Popular contemporary translation'
      },
      {
        id: 'esv',
        name: 'English Standard Version',
        abbreviation: 'ESV',
        language: 'English',
        year: 2001,
        description: 'Literal yet readable translation'
      },
      {
        id: 'nlt',
        name: 'New Living Translation',
        abbreviation: 'NLT',
        language: 'English',
        year: 2015,
        description: 'Thought-for-thought translation'
      },
      {
        id: 'msg',
        name: 'The Message',
        abbreviation: 'MSG',
        language: 'English',
        year: 2002,
        description: 'Contemporary paraphrase'
      }
    ];

    // Get user's current preferred version
    const user = await User.findById(req.user.id);
    const currentVersion = user.preferredBibleVersion || 'kjv';

    res.status(200).json({
      success: true,
      data: {
        versions: bibleVersions,
        currentVersion: currentVersion,
        totalVersions: bibleVersions.length
      }
    });

  } catch (error) {
    console.error('Error getting Bible versions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// @desc    Mark Old Testament reading as complete for a specific day
// @route   PUT /api/reading/complete-old-testament/:day
// @access  Private
exports.markOldTestamentComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { day } = req.params;
    const readingDay = parseInt(day);

    // Validate day parameter
    if (!readingDay || readingDay < 1 || readingDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day parameter. Must be between 1 and 365.'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Find or create completion record for this day
    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      // Create new completion record
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: false,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      // Update existing record
      dayCompletion.oldTestamentComplete = true;
      if (!dayCompletion.completedAt) {
        dayCompletion.completedAt = new Date();
      }
    }

    // Update overall completion status for the day
    const isFullyComplete = dayCompletion.oldTestamentComplete && dayCompletion.newTestamentComplete;
    
    // Update user's current day if this is the next sequential day
    if (readingDay === userProgress.currentDay && isFullyComplete) {
      userProgress.currentDay = Math.min(readingDay + 1, 365);
    }

    // Recalculate percentage complete
    const fullyCompletedDays = userProgress.completedDays.filter(
      day => day.oldTestamentComplete && day.newTestamentComplete
    ).length;
    userProgress.percentageComplete = Math.round((fullyCompletedDays / 365) * 100);

    await userProgress.save();

    // Update streak if day is fully complete
    if (isFullyComplete) {
      await updateUserStreak(req.user.id);
    }

    res.status(200).json({
      success: true,
      message: 'Old Testament reading marked as complete',
      data: {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: dayCompletion.newTestamentComplete,
        fullyComplete: isFullyComplete,
        currentDay: userProgress.currentDay,
        percentageComplete: userProgress.percentageComplete
      }
    });

  } catch (error) {
    console.error('Error marking Old Testament complete:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Mark New Testament reading as complete for a specific day
// @route   PUT /api/reading/complete-new-testament/:day
// @access  Private
exports.markNewTestamentComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { day } = req.params;
    const readingDay = parseInt(day);

    // Validate day parameter
    if (!readingDay || readingDay < 1 || readingDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day parameter. Must be between 1 and 365.'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Find or create completion record for this day
    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      // Create new completion record
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: false,
        newTestamentComplete: true,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      // Update existing record
      dayCompletion.newTestamentComplete = true;
      if (!dayCompletion.completedAt) {
        dayCompletion.completedAt = new Date();
      }
    }

    // Update overall completion status for the day
    const isFullyComplete = dayCompletion.oldTestamentComplete && dayCompletion.newTestamentComplete;
    
    // Update user's current day if this is the next sequential day
    if (readingDay === userProgress.currentDay && isFullyComplete) {
      userProgress.currentDay = Math.min(readingDay + 1, 365);
    }

    // Recalculate percentage complete
    const fullyCompletedDays = userProgress.completedDays.filter(
      day => day.oldTestamentComplete && day.newTestamentComplete
    ).length;
    userProgress.percentageComplete = Math.round((fullyCompletedDays / 365) * 100);

    await userProgress.save();

    // Update streak if day is fully complete
    if (isFullyComplete) {
      await updateUserStreak(req.user.id);
    }

    res.status(200).json({
      success: true,
      message: 'New Testament reading marked as complete',
      data: {
        day: readingDay,
        oldTestamentComplete: dayCompletion.oldTestamentComplete,
        newTestamentComplete: true,
        fullyComplete: isFullyComplete,
        currentDay: userProgress.currentDay,
        percentageComplete: userProgress.percentageComplete
      }
    });

  } catch (error) {
    console.error('Error marking New Testament complete:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Mark both Old and New Testament as complete for a specific day
// @route   PUT /api/reading/complete-day/:day
// @access  Private
exports.markDayComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { day } = req.params;
    const readingDay = parseInt(day);

    // Validate day parameter
    if (!readingDay || readingDay < 1 || readingDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day parameter. Must be between 1 and 365.'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Find or create completion record for this day
    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      // Create new completion record
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: true,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      // Update existing record
      dayCompletion.oldTestamentComplete = true;
      dayCompletion.newTestamentComplete = true;
      dayCompletion.completedAt = new Date();
    }

    // Update user's current day if this is the next sequential day
    if (readingDay === userProgress.currentDay) {
      userProgress.currentDay = Math.min(readingDay + 1, 365);
    }

    // Recalculate percentage complete
    const fullyCompletedDays = userProgress.completedDays.filter(
      day => day.oldTestamentComplete && day.newTestamentComplete
    ).length;
    userProgress.percentageComplete = Math.round((fullyCompletedDays / 365) * 100);

    await userProgress.save();

    // Update streak
    await updateUserStreak(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Day marked as fully complete',
      data: {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: true,
        fullyComplete: true,
        currentDay: userProgress.currentDay,
        percentageComplete: userProgress.percentageComplete
      }
    });

  } catch (error) {
    console.error('Error marking day complete:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to update user streak
const updateUserStreak = async (userId) => {
  try {
    let streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      streak = new Streak({ user: userId });
    }

    const today = new Date();
    const lastCheckIn = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
    
    // Check if this is a consecutive day
    if (lastCheckIn) {
      const daysDifference = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 1) {
        // Consecutive day - increment streak
        streak.currentStreak += 1;
      } else if (daysDifference > 1) {
        // Missed days - reset streak
        streak.currentStreak = 1;
      }
      // If daysDifference === 0, same day - don't increment
    } else {
      // First check-in
      streak.currentStreak = 1;
    }

    // Update longest streak if current is higher
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastCheckIn = today;
    await streak.save();

    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

// @desc    Get user streak information
// @route   GET /api/reading/streak
// @access  Private
exports.getStreak = async (req, res, next) => {
  try {
    let streak = await Streak.findOne({ user: req.user.id });

    if (!streak) {
      streak = new Streak({ user: req.user.id });
      await streak.save();
    }

    res.status(200).json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastCheckIn: streak.lastCheckIn
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Get user's full streak history
// @route   GET /api/reading/streak-history
// @access  Private
exports.getStreakHistory = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ user: req.user.id });

    if (!streak) {
      return res.status(404).json({
        success: false,
        message: 'No streak data found'
      });
    }

    res.status(200).json({
      success: true,
      streakHistory: streak.streakHistory
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Get user's reading progress (IMPROVED)
// @route   GET /api/reading/progress
// @access  Private
exports.getProgress = async (req, res, next) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // FIX: Add null safety for booksRead
    const completedBooks = userProgress.booksRead?.filter(book => book.completed)?.length || 0;
    const totalCompletedDays = userProgress.completedDays?.length || 0;

    res.status(200).json({
      success: true,
      progress: {
        currentDay: userProgress.currentDay || 1,
        completedDays: totalCompletedDays,
        percentageComplete: userProgress.percentageComplete || 0,
        booksCompleted: completedBooks,
        totalBooks: 66
      }
    });
  } catch (error) {
    console.error('Error in getProgress:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// @desc    Get yearly progress statistics
// @route   GET /api/reading/yearly-progress/:year
// @access  Private

exports.getYearlyProgress = async (req, res, next) => {
  try {
    const { year } = req.params;
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // FIX: Validate year parameter
    if (currentYear < 2020 || currentYear > 2030) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year parameter'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    const today = new Date();

    // FIX: Add null safety for completedDays
    const completedDaysThisYear = (userProgress.completedDays || []).filter(day => {
      if (!day.completedAt) return false;
      const completedDate = new Date(day.completedAt);
      return completedDate >= startOfYear && completedDate <= endOfYear;
    });

    // FIX: Better date calculation
    const daysPassed = Math.min(
      Math.max(1, Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1),
      365
    );
    
    const totalDaysInYear = ((currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0)) ? 366 : 365;
    const yearlyPercentage = Math.round((completedDaysThisYear.length / totalDaysInYear) * 100);

    res.status(200).json({
      success: true,
      yearlyProgress: {
        year: currentYear,
        completedDays: completedDaysThisYear.length,
        totalDaysInYear: totalDaysInYear,
        daysPassed: Math.min(daysPassed, totalDaysInYear),
        percentageComplete: yearlyPercentage,
        averageDaysPerMonth: Math.round((completedDaysThisYear.length / 12) * 10) / 10,
        onTrack: completedDaysThisYear.length >= (daysPassed * 0.8)
      }
    });
  } catch (error) {
    console.error('Error getting yearly progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};




// ===================== NOTES FUNCTIONALITY =====================

// @desc    Add a note for a specific day's reading
// @route   POST /api/reading/notes
// @access  Private

exports.addNote = async (req, res) => {
  try {
    const { note, verse } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    const newNote = {
      verse: verse?.trim(),
      note: note.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userProgress.notes.push(newNote);
    await userProgress.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note: newNote
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// @desc    Get notes for a specific note by ID or all notes
// @route   GET /api/reading/notes/:id?
// @access  Private
exports.getNotes = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    let notes = userProgress.notes || [];

    if (id) {
      const note = notes.find(n => n._id.toString() === id);
      if (!note) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      return res.status(200).json({ success: true, note });
    }

    res.status(200).json({ success: true, notes, totalNotes: notes.length });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// @desc    Update a note
// @route   PUT /api/reading/notes/:id
// @access  Private
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    const noteToUpdate = userProgress.notes.find(n => n._id.toString() === id);
    if (!noteToUpdate) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    noteToUpdate.note = note.trim();
    noteToUpdate.updatedAt = new Date();

    await userProgress.save();

    res.status(200).json({ success: true, message: 'Note updated successfully', note: noteToUpdate });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/reading/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress || !userProgress.notes) {
      return res.status(404).json({ success: false, message: 'No notes found' });
    }

    const initialLength = userProgress.notes.length;
    userProgress.notes = userProgress.notes.filter(note => note._id.toString() !== noteId);

    if (userProgress.notes.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await userProgress.save();

    return res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// ===================== HIGHLIGHTS FUNCTIONALITY =====================
// Add these endpoints to your existing reading controller

// @desc    Add a highlight for a specific verse
// @route   POST /api/reading/highlights
// @access  Private
exports.addHighlight = async (req, res) => {
  try {
    const { verse, verseText, book, chapter, color, day } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate required fields
    if (!verse || !verseText || !book || !chapter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verse, verseText, book, and chapter are required' 
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    // Initialize highlights array if it doesn't exist
    if (!userProgress.highlights) {
      userProgress.highlights = [];
    }

    const newHighlight = {
      verse: verse.trim(),
      verseText: verseText.trim(),
      book: book.trim(),
      chapter: parseInt(chapter),
      color: color || 'yellow', // Default highlight color
      day: day || null, // Optional: which reading day this belongs to
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userProgress.highlights.push(newHighlight);
    await userProgress.save();

    res.status(201).json({
      success: true,
      message: 'Highlight added successfully',
      highlight: newHighlight
    });
  } catch (error) {
    console.error('Error adding highlight:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};


// @desc    Get highlights for a specific highlight by ID or all highlights
// @route   GET /api/reading/highlights/:id?
// @access  Private
exports.getHighlights = async (req, res) => {
  try {
    const { id } = req.params;
    const { book, chapter, day, color } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    let highlights = userProgress.highlights || [];

    // Get specific highlight by ID
    if (id) {
      const highlight = highlights.find(h => h._id.toString() === id);
      if (!highlight) {
        return res.status(404).json({ success: false, message: 'Highlight not found' });
      }
      return res.status(200).json({ success: true, highlight });
    }

    // Filter highlights based on query parameters
    if (book) {
      highlights = highlights.filter(h => h.book.toLowerCase() === book.toLowerCase());
    }
    if (chapter) {
      highlights = highlights.filter(h => h.chapter === parseInt(chapter));
    }
    if (day) {
      highlights = highlights.filter(h => h.day === parseInt(day));
    }
    if (color) {
      highlights = highlights.filter(h => h.color === color);
    }

    // Sort highlights by creation date (newest first)
    highlights.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ 
      success: true, 
      highlights, 
      totalHighlights: highlights.length 
    });
  } catch (error) {
    console.error('Error getting highlights:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};


// @desc    Delete a highlight
// @route   DELETE /api/reading/highlights/:id
// @access  Private
exports.deleteHighlight = async (req, res) => {
  try {
    const highlightId = req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress || !userProgress.highlights) {
      return res.status(404).json({ success: false, message: 'No highlights found' });
    }

    const initialLength = userProgress.highlights.length;
    userProgress.highlights = userProgress.highlights.filter(
      highlight => highlight._id.toString() !== highlightId
    );

    if (userProgress.highlights.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Highlight not found' });
    }

    await userProgress.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Highlight deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};