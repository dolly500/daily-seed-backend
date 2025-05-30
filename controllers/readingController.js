const { validationResult } = require('express-validator');
const User = require('../models/User');
const BibleContent = require('../models/BibleContent');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const READING_PLAN_DATA = require('../scripts/readingPlan');
const axios = require('axios');
const NodeCache = require('node-cache'); 
const cache = new NodeCache({ stdTTL: 3600 });

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

// @desc    Get reading for a specific day (calendar selection)
// @route   GET /api/reading/day/:day
// @access  Private
exports.getReadingByDay = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const requestedDay = parseInt(req.params.day);
    
    if (!requestedDay || requestedDay < 1 || requestedDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 365'
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

    const dayReading = userProgress.customReadings?.find(r => r.day === requestedDay);

    if (!dayReading) {
      return res.status(404).json({
        success: false,
        message: `Reading not found for day ${requestedDay}`
      });
    }

    // Check if this day is completed
    const isCompleted = userProgress.completedDays.some(
      completedDay => completedDay.day === requestedDay
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
      )
    ]);

    return res.status(200).json({
      success: true,
      reading: {
        day: requestedDay,
        date: calculateDateFromDay(userProgress.startDate, requestedDay),
        isCompleted: isCompleted,
        oldTestament: {
          book: dayReading.oldTestament.book,
          startChapter: dayReading.oldTestament.startChapter,
          endChapter: dayReading.oldTestament.endChapter,
          content: otContent.verses,
          reference: otContent.reference,
          translation: otContent.translation,
          ...(otContent.error && { error: otContent.error })
        },
        newTestament: {
          book: dayReading.newTestament.book,
          startChapter: dayReading.newTestament.startChapter,
          endChapter: dayReading.newTestament.endChapter,
          content: ntContent.verses,
          reference: ntContent.reference,
          translation: ntContent.translation,
          ...(ntContent.error && { error: ntContent.error })
        }
      }
    });
  } catch (error) {
    console.error('Error in getReadingByDay:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// @desc    Get today's reading passage
// @route   GET /api/reading/today?day=1
// @access  Private
exports.getTodaysReading = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
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

    // Accept a specific day from query or default to currentDay
    const requestedDay = parseInt(req.query.day) || userProgress.currentDay;

    const dayReading = userProgress.customReadings?.find(r => r.day === requestedDay);

    if (!dayReading) {
      return res.status(404).json({
        success: false,
        message: `Reading not found for day ${requestedDay}`
      });
    }

    // Fetch content from Bible API instead of local database
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
      )
    ]);

    return res.status(200).json({
      success: true,
      reading: {
        day: requestedDay,
        date: new Date(),
        oldTestament: {
          book: dayReading.oldTestament.book,
          startChapter: dayReading.oldTestament.startChapter,
          endChapter: dayReading.oldTestament.endChapter,
          content: otContent.verses,
          reference: otContent.reference,
          translation: otContent.translation,
          ...(otContent.error && { error: otContent.error })
        },
        newTestament: {
          book: dayReading.newTestament.book,
          startChapter: dayReading.newTestament.startChapter,
          endChapter: dayReading.newTestament.endChapter,
          content: ntContent.verses,
          reference: ntContent.reference,
          translation: ntContent.translation,
          ...(ntContent.error && { error: ntContent.error })
        }
      }
    });
  } catch (error) {
    console.error('Error in getTodaysReading:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// @desc    Mark a specific day's reading as complete
// @route   POST /api/reading/complete/:day
// @access  Private
exports.markDayComplete = async (req, res, next) => {
  try {
    const dayToComplete = parseInt(req.params.day);
    
    if (!dayToComplete || dayToComplete < 1 || dayToComplete > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be between 1 and 365'
      });
    }

    let userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    const alreadyCompleted = userProgress.completedDays.some(day => day.day === dayToComplete);

    if (!alreadyCompleted) {
      userProgress.completedDays.push({
        day: dayToComplete,
        completedAt: new Date()
      });

      userProgress.lastReadDate = new Date();
      userProgress.percentageComplete = userProgress.calculateProgress?.() || 0;
      
      // Update current day if completing current or future day
      if (dayToComplete >= userProgress.currentDay) {
        userProgress.currentDay = Math.max(userProgress.currentDay, dayToComplete + 1);
      }

      await userProgress.save();

      let streak = await Streak.findOne({ user: req.user.id });
      if (!streak) {
        streak = new Streak({ user: req.user.id });
      }

      await streak.updateStreak(new Date());
      await streak.save();
    }

    res.status(200).json({
      success: true,
      message: `Day ${dayToComplete} reading marked as complete`,
      progress: {
        currentDay: userProgress.currentDay,
        percentageComplete: userProgress.percentageComplete,
        completedDays: userProgress.completedDays.length,
        dayCompleted: dayToComplete
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Mark today's reading as complete (original functionality)
// @route   POST /api/reading/complete
// @access  Private
exports.markReadingComplete = async (req, res, next) => {
  try {
    let userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    const currentDay = userProgress.currentDay;
    const alreadyCompleted = userProgress.completedDays.some(day => day.day === currentDay);

    if (!alreadyCompleted) {
      userProgress.completedDays.push({
        day: currentDay,
        completedAt: new Date()
      });

      userProgress.lastReadDate = new Date();
      userProgress.percentageComplete = userProgress.calculateProgress?.() || 0;
      userProgress.currentDay = currentDay + 1;

      await userProgress.save();

      let streak = await Streak.findOne({ user: req.user.id });
      if (!streak) {
        streak = new Streak({ user: req.user.id });
      }

      await streak.updateStreak(new Date());
      await streak.save();
    }

    res.status(200).json({
      success: true,
      message: 'Reading marked as complete',
      progress: {
        currentDay: userProgress.currentDay,
        percentageComplete: userProgress.percentageComplete,
        completedDays: userProgress.completedDays.length
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Get calendar data with reading assignments
// @route   GET /api/reading/calendar/:year/:month
// @access  Private
exports.getCalendarData = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    const requestedMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Calculate which reading days correspond to this calendar month
    const calendarData = [];
    
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(year, month - 1, date);
      const daysSinceStart = Math.floor((currentDate - userProgress.startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Only include days that have reading assignments (1-365)
      if (daysSinceStart >= 1 && daysSinceStart <= 365) {
        const reading = userProgress.customReadings?.find(r => r.day === daysSinceStart);
        const isCompleted = userProgress.completedDays.some(day => day.day === daysSinceStart);
        
        calendarData.push({
          date: date,
          readingDay: daysSinceStart,
          isCompleted: isCompleted,
          hasReading: !!reading,
          reading: reading ? {
            oldTestament: `${reading.oldTestament.book} ${reading.oldTestament.startChapter}${reading.oldTestament.endChapter > reading.oldTestament.startChapter ? `-${reading.oldTestament.endChapter}` : ''}`,
            newTestament: `${reading.newTestament.book} ${reading.newTestament.startChapter}${reading.newTestament.endChapter > reading.newTestament.startChapter ? `-${reading.newTestament.endChapter}` : ''}`
          } : null
        });
      } else {
        calendarData.push({
          date: date,
          readingDay: null,
          isCompleted: false,
          hasReading: false,
          reading: null
        });
      }
    }

    res.status(200).json({
      success: true,
      calendar: {
        year: parseInt(year),
        month: parseInt(month),
        days: calendarData,
        totalDaysInMonth: daysInMonth
      }
    });
  } catch (error) {
    console.error('Error getting calendar data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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

const fetchBibleContentWithCache = async (book, startChapter, endChapter, version = 'kjv') => {
  const cacheKey = `${book}-${startChapter}-${endChapter}-${version}`;
  
  // Check cache first
  const cachedContent = cache.get(cacheKey);
  if (cachedContent) {
    return cachedContent;
  }

  // Fetch from API if not in cache
  const content = await fetchBibleContent(book, startChapter, endChapter, version);
  
  // Only cache successful responses
  if (content.verses && content.verses.length > 0) {
    cache.set(cacheKey, content);
  }

  return content;
};

// Helper function to fetch Bible content from Bible API
const fetchBibleContent = async (book, startChapter, endChapter, version = 'kjv') => {
  try {
    // Always use both startChapter and endChapter
    const chapterRange = endChapter && endChapter !== startChapter 
      ? `${startChapter}-${endChapter}` 
      : startChapter.toString();
    
    // Format the reference for the API
    const reference = `${book}+${chapterRange}`;
    
    // Make request to Bible API
    const response = await axios.get(`https://bible-api.com/${reference}`, {
      params: {
        translation: version.toLowerCase()
      },
      timeout: 10000 // 10 second timeout
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
    console.error(`Error fetching Bible content for ${book} ${startChapter}-${endChapter}:`, error.message);
    
    // Return empty content on error to prevent breaking the API
    return { 
      verses: [], 
      reference: `${book} ${startChapter}${endChapter && endChapter !== startChapter ? `-${endChapter}` : ''}`,
      translation: version.toUpperCase(),
      error: error.message 
    };
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

// @desc    Get user's reading progress
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

    const completedBooks = userProgress.booksRead.filter(book => book.completed).length;

    res.status(200).json({
      success: true,
      progress: {
        currentDay: userProgress.currentDay,
        completedDays: userProgress.completedDays.length,
        percentageComplete: userProgress.percentageComplete,
        booksCompleted: completedBooks,
        totalBooks: 66
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Get Bible content for specific passage
// @route   GET /api/reading/passage/:version/:book/:chapter
// @access  Private
exports.getPassage = async (req, res, next) => {
  try {
    const { version, book, chapter } = req.params;

    const content = await BibleContent.findOne({ version, book, chapter });

    if (!content) {
      return res.status(404).json({ success: false, message: 'Passage not found' });
    }

    res.status(200).json({ success: true, passage: content });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Get yearly progress statistics
// @route   GET /api/reading/yearly-progress/:year
// @access  Private
exports.getYearlyProgress = async (req, res, next) => {
  try {
    const { year } = req.params;
    const currentYear = year || new Date().getFullYear();
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
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

    const completedDaysThisYear = userProgress.completedDays.filter(day => {
      const completedDate = new Date(day.completedAt);
      return completedDate >= startOfYear && completedDate <= endOfYear;
    });

    const daysPassed = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const totalDaysInYear = ((currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0)) ? 366 : 365;

    const yearlyPercentage = Math.round((completedDaysThisYear.length / totalDaysInYear) * 100);

    res.status(200).json({
      success: true,
      yearlyProgress: {
        year: parseInt(currentYear),
        completedDays: completedDaysThisYear.length,
        totalDaysInYear: totalDaysInYear,
        daysPassed: Math.min(daysPassed, totalDaysInYear),
        percentageComplete: yearlyPercentage,
        averageDaysPerMonth: Math.round(completedDaysThisYear.length / 12 * 10) / 10,
        onTrack: completedDaysThisYear.length >= daysPassed * 0.8
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

// @desc    Get detailed daily completion status
// @route   GET /api/reading/daily-status
// @access  Private
exports.getDailyStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    const today = new Date();
    const todayString = today.toDateString();

    const todayCompleted = userProgress.completedDays.some(day => {
      return new Date(day.completedAt).toDateString() === todayString;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      const completed = userProgress.completedDays.some(day => {
        return new Date(day.completedAt).toDateString() === dateString;
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        completed: completed,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    res.status(200).json({
      success: true,
      dailyStatus: {
        todayCompleted: todayCompleted,
        currentDay: userProgress.currentDay,
        last7Days: last7Days,
        totalCompletedDays: userProgress.completedDays.length,
        lastReadDate: userProgress.lastReadDate
      }
    });
  } catch (error) {
    console.error('Error getting daily status:', error);
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