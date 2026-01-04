const { validationResult } = require('express-validator');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const READING_PLAN_DATA = require('../scripts/readingPlan');
const axios = require('axios');
const NodeCache = require('node-cache');
const SCRIPTURE_API_KEY = process.env.SCRIPTURE_API_KEY; 
const versionCache = new NodeCache({ stdTTL: 86400 });

// Helper function to map version abbreviations to Scripture API IDs
const mapVersionAbbreviationToId = (abbreviation) => {
  const versionMap = {
    'kjv': 'de4e12af7f28f599-02',
    'web': '9879dbb7cfe39e4d-04',
    'net': '107e916c8d0c5d35-01',
    'nasb': '65eec8e0b60e656b-01',
    'niv': '78a9f6124f344018-01',
    'esv': 'f421fe261da7624f-01',
    'nlt': '7142879509583d59-01',
    'msg': '6bab4d6c61b31b8f-01'
  };
  return versionMap[abbreviation?.toLowerCase()] || 'de4e12af7f28f599-02'; // Default to KJV
};

// @desc    Initialize user reading progress
// @route   POST /api/reading/init
// @access  Private
exports.initUserProgress = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let existingProgress = await UserProgress.findOne({ user: req.user.id });
    if (existingProgress) {
      return res.status(400).json({ success: false, message: 'Reading progress already exists' });
    }

    const newProgress = new UserProgress({
      user: req.user.id,
      currentDay: 1,
      booksRead: [
        { testament: 'Old Testament', book: 'Genesis', completed: false, chaptersRead: [] },
        { testament: 'New Testament', book: 'Matthew', completed: false, chaptersRead: [] }
      ],
      customReadings: READING_PLAN_DATA,
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
    const { versionId: queryVersionId } = req.query; // Get versionId from query string

    // Validate date parameters
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
    
    const requestedDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));
    
    if (isNaN(requestedDate.getTime()) || 
        parsedDay < 1 || 
        parsedDay > new Date(parsedYear, parsedMonth, 0).getDate()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameters'
      });
    }

    // Determine the Bible version ID to use
    let bibleVersionId = 'de4e12af7f28f599-02'; // Default to KJV
    
    // Priority 1: Use versionId from query string if provided
    if (queryVersionId) {
      bibleVersionId = queryVersionId;
      console.log('Using versionId from query string:', queryVersionId);
    } else {
      // Priority 2: Fetch user's saved preference
      const user = await User.findById(req.user.id).select('preferredBibleVersion');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.preferredBibleVersion) {
        // Check if it's already a version ID (contains dashes and is long)
        if (user.preferredBibleVersion.includes('-') && user.preferredBibleVersion.length > 10) {
          bibleVersionId = user.preferredBibleVersion;
        } else {
          // It's an abbreviation, map it to ID
          bibleVersionId = mapVersionAbbreviationToId(user.preferredBibleVersion);
        }
        console.log('Using user saved preference:', bibleVersionId);
      }
    }

    console.log('=== BIBLE VERSION DEBUG ===');
    console.log('User ID:', req.user.id);
    console.log('Query versionId:', queryVersionId);
    console.log('Final bibleVersionId:', bibleVersionId);
    console.log('==========================');

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Calculate reading day: This maps calendar date to reading plan day
    // Start of year = January 1 = Day 1 of reading plan
    const startOfYear = new Date(parsedYear, 0, 1);
    const dayOfYear = Math.floor((requestedDate - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    
    // For non-leap years: 1-365
    // For leap years: 1-366, but reading plan only has 365 entries
    // So for leap years, after Feb 29 (day 60), we adjust by -1
    const isLeapYear = (parsedYear % 4 === 0 && parsedYear % 100 !== 0) || (parsedYear % 400 === 0);
    let readingDay = dayOfYear;
    
    if (isLeapYear && dayOfYear > 60) {
      readingDay = dayOfYear - 1; // Adjust for leap day
    }
    
    // Ensure reading day is within valid range
    if (readingDay < 1 || readingDay > 365) {
      return res.status(400).json({
        success: false,
        message: 'Reading day out of valid range'
      });
    }

    const dayReading = READING_PLAN_DATA.find(r => r.day === readingDay);
    if (!dayReading) {
      return res.status(404).json({
        success: false,
        message: `Reading not found for day ${readingDay}`
      });
    }

    const isCompleted = userProgress.completedDays.some(
      completedDay => completedDay.day === readingDay
    );

    // Fetch content from Bible API with the selected version
    const [otContent, ntContent] = await Promise.all([
      fetchBibleContent(
        dayReading.oldTestament.book,
        dayReading.oldTestament.startChapter,
        dayReading.oldTestament.endChapter,
        bibleVersionId
      ),
      fetchBibleContent(
        dayReading.newTestament.book,
        dayReading.newTestament.startChapter,
        dayReading.newTestament.endChapter,
        bibleVersionId
      ),
    ]);

    return res.status(200).json({
      success: true,
      reading: {
        day: parsedDay,
        readingDay: readingDay,
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

// @desc    Get reading progress for a specific month (calendar view)
// @route   GET /api/reading/calendar/:year/:month
// @access  Private
exports.getCalendarData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { year, month } = req.params;

    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    if (
      isNaN(parsedYear) ||
      isNaN(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      parsedYear < 2020 ||
      parsedYear > 2030
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month parameters',
      });
    }

    const startOfMonth = new Date(parsedYear, parsedMonth - 1, 1);
    const endOfMonth = new Date(parsedYear, parsedMonth, 0);
    const daysInMonth = endOfMonth.getDate();

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found',
      });
    }

    const monthRanges = [
      { month: 1, startDay: 1, endDay: 31 },
      { month: 2, startDay: 32, endDay: 59 },
      { month: 3, startDay: 60, endDay: 90 },
      { month: 4, startDay: 91, endDay: 120 },
      { month: 5, startDay: 121, endDay: 151 },
      { month: 6, startDay: 152, endDay: 181 },
      { month: 7, startDay: 182, endDay: 212 },
      { month: 8, startDay: 213, endDay: 243 },
      { month: 9, startDay: 244, endDay: 273 },
      { month: 10, startDay: 274, endDay: 304 },
      { month: 11, startDay: 305, endDay: 334 },
      { month: 12, startDay: 335, endDay: 365 }
    ];

    const monthRange = monthRanges.find(range => range.month === parsedMonth);
    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: 'Reading plan not defined for this month'
      });
    }

    const calendarData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(parsedYear, parsedMonth - 1, day);
      const readingDay = monthRange.startDay + (day - 1);

      if (readingDay > monthRange.endDay) {
        calendarData.push({
          date: currentDate,
          dayOfMonth: day,
          readingDay: null,
          isCompleted: false,
          oldTestament: null,
          newTestament: null,
        });
        continue;
      }

      const dayReading = READING_PLAN_DATA.find(r => r.day === readingDay);
      const dayCompletion = userProgress.completedDays.find(
        completedDay => completedDay.day === readingDay
      );
      const isCompleted = dayCompletion
        ? dayCompletion.oldTestamentComplete && dayCompletion.newTestamentComplete
        : false;

      calendarData.push({
        date: currentDate,
        dayOfMonth: day,
        readingDay: readingDay,
        isCompleted: isCompleted,
        oldTestament: dayReading
          ? {
              book: dayReading.oldTestament.book,
              startChapter: dayReading.oldTestament.startChapter,
              endChapter: dayReading.oldTestament.endChapter,
              startVerse: dayReading.oldTestament.startVerse || null,
              endVerse: dayReading.oldTestament.endVerse || null,
            }
          : null,
        newTestament: dayReading
          ? {
              book: dayReading.newTestament.book,
              startChapter: dayReading.newTestament.startChapter,
              endChapter: dayReading.newTestament.endChapter,
              startVerse: dayReading.newTestament.startVerse || null,
              endVerse: dayReading.newTestament.endVerse || null,
            }
          : null,
      });
    }

    return res.status(200).json({
      success: true,
      calendarData: {
        year: parsedYear,
        month: parsedMonth,
        days: calendarData,
        totalDays: daysInMonth,
        completedDays: calendarData.filter(day => day.isCompleted).length,
      },
    });
  } catch (error) {
    console.error('Error in getCalendarData:', error);
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
  
  return READING_PLAN_DATA.map((reading, index) => {
    if (!reading.day || !reading.oldTestament || !reading.newTestament) {
      throw new Error(`Invalid reading structure at index ${index}`);
    }
    
    const transformedReading = {
      day: reading.day,
      oldTestament: {
        book: reading.oldTestament.book,
        startChapter: reading.oldTestament.startChapter,
        endChapter: reading.oldTestament.endChapter || reading.oldTestament.startChapter
      },
      newTestament: {
        book: reading.newTestament.book,
        startChapter: reading.newTestament.startChapter,
        endChapter: reading.newTestament.endChapter || reading.newTestament.startChapter
      }
    };
    
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

// Helper function to map book names to Scripture API book IDs
function mapBookNameToId(bookName) {
  const bookMap = {
    // Old Testament
    'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
    'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
    '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
    'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 
    'Psalm': 'PSA', 'Psalms': 'PSA',
    'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
    'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
    'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
    'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG',
    'Zechariah': 'ZEC', 'Malachi': 'MAL',
    // New Testament
    'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
    'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
    'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
    '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
    'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
    '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
  };

  return bookMap[bookName] || null;
}

// Helper function to parse Scripture API content 
function parseScriptureAPIContent(content, chapter) {
  const verses = [];
  
  if (!content || !Array.isArray(content)) return verses;

  // Recursive function to extract text from nested items
  function extractText(items) {
    if (!items || !Array.isArray(items)) return '';
    
    let text = '';
    for (const item of items) {
      if (item.type === 'text' && item.text) {
        text += item.text;
      } else if (item.type === 'tag' && item.items) {
        // Recursively extract text from nested tags
        text += extractText(item.items);
      }
    }
    return text;
  }

  // Process each paragraph/section
  for (const para of content) {
    if (para.type === 'tag' && para.items) {
      let currentVerseNumber = null;
      let currentVerseText = '';
      
      for (const item of para.items) {
        // Check if this is a verse marker
        if (item.type === 'tag' && item.name === 'verse' && item.attrs && item.attrs.number) {
          // Save previous verse if it exists
          if (currentVerseNumber && currentVerseText.trim()) {
            verses.push({
              verse: `${chapter}:${currentVerseNumber}`,
              text: currentVerseText.trim()
            });
          }
          
          // Start new verse
          currentVerseNumber = item.attrs.number;
          currentVerseText = '';
        } 
        // Check if this is text belonging to a verse
        else if (currentVerseNumber) {
          if (item.type === 'text' && item.text) {
            currentVerseText += item.text;
          } else if (item.type === 'tag' && item.items) {
            // Extract text from nested tags (like 'char' tags with 'add' style)
            currentVerseText += extractText(item.items);
          }
        }
      }
      
      // Don't forget the last verse in the paragraph
      if (currentVerseNumber && currentVerseText.trim()) {
        verses.push({
          verse: `${chapter}:${currentVerseNumber}`,
          text: currentVerseText.trim()
        });
      }
    }
  }
  
  return verses;
}

const fetchBibleContent = async (book, startChapter, endChapter, versionId = 'de4e12af7f28f599-02', maxRetries = 3) => {
  if (!book || !startChapter || isNaN(startChapter)) {
    return {
      verses: [],
      reference: `${book || 'Unknown'} ${startChapter || ''}`,
      translation: versionId,
      error: 'Invalid book or chapter parameters'
    };
  }

  const chapterRange = endChapter && endChapter !== startChapter && !isNaN(endChapter)
    ? `${startChapter}-${endChapter}`
    : startChapter.toString();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bookId = mapBookNameToId(book);
      
      console.log('=== FETCH DEBUG ===');
      console.log('Book:', book);
      console.log('BookID:', bookId);
      console.log('Chapters:', startChapter, '-', endChapter);
      
      if (!bookId) {
        return {
          verses: [],
          reference: `${book} ${chapterRange}`,
          translation: versionId,
          error: `Book "${book}" not found in mapping`
        };
      }

      const verses = [];
      const start = parseInt(startChapter);
      const end = endChapter ? parseInt(endChapter) : start;

      for (let chapter = start; chapter <= end; chapter++) {
        const url = `https://api.scripture.api.bible/v1/bibles/${versionId}/chapters/${bookId}.${chapter}`;
        console.log('Fetching URL:', url);
        
        const response = await axios.get(url, {
          headers: {
            'api-key': SCRIPTURE_API_KEY
          },
          params: {
            'content-type': 'json',
            'include-verse-numbers': true,
            'include-titles': false,
            'include-chapter-numbers': false,
            'include-verse-spans': false
          },
          timeout: 10000
        });

        console.log('=== API RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Data keys:', Object.keys(response.data));
        
        if (response.data && response.data.data) {
          console.log('Data.data keys:', Object.keys(response.data.data));
          console.log('Content type:', typeof response.data.data.content);
          console.log('Content is array?', Array.isArray(response.data.data.content));
          
          // Log first few characters/items of content
          if (typeof response.data.data.content === 'string') {
            console.log('Content (first 200 chars):', response.data.data.content.substring(0, 200));
          } else if (Array.isArray(response.data.data.content)) {
            console.log('Content array length:', response.data.data.content.length);
            console.log('First content item:', JSON.stringify(response.data.data.content[0], null, 2));
          } else {
            console.log('Content:', response.data.data.content);
          }
          
          const chapterData = response.data.data;
          
          if (chapterData.content) {
            const chapterVerses = parseScriptureAPIContent(chapterData.content, chapter);
            console.log(`Parsed ${chapterVerses.length} verses for ${bookId}.${chapter}`);
            
            if (chapterVerses.length > 0) {
              console.log('First verse:', chapterVerses[0]);
            }
            
            verses.push(...chapterVerses);
          } else {
            console.log('No content found in chapterData');
          }
        } else {
          console.log('Invalid response structure');
        }
      }

      console.log('Total verses collected:', verses.length);
      console.log('===================');

      if (verses.length > 0) {
        return {
          verses: verses,
          reference: `${book} ${chapterRange}`,
          translation: versionId
        };
      }

      return {
        verses: [],
        reference: `${book} ${chapterRange}`,
        translation: versionId,
        error: 'No verses returned from API'
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${book} ${chapterRange} (${versionId}):`, error.message);
      
      if (error.response) {
        console.error('API Error Status:', error.response.status);
        console.error('API Error Data:', error.response.data);
      }
      
      if (attempt === maxRetries) {
        return {
          verses: [],
          reference: `${book} ${chapterRange}`,
          translation: versionId,
          error: `Failed after ${maxRetries} attempts: ${error.message}`
        };
      }
      
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

    // Check cache first
    const cachedVersions = versionCache.get('bibleVersions');
    if (cachedVersions) {
      const user = await User.findById(req.user.id);
      const currentVersion = user.preferredBibleVersion || 'de4e12af7f28f599-02'; // KJV default

      return res.status(200).json({
        success: true,
        data: {
          versions: cachedVersions,
          currentVersion: currentVersion,
          totalVersions: cachedVersions.length
        }
      });
    }

    // Fetch from Scripture API if not cached
    const response = await axios.get('https://api.scripture.api.bible/v1/bibles', {
      headers: {
        'api-key': SCRIPTURE_API_KEY
      },
      params: {
        language: 'eng' // Filter for English versions only
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from Scripture API');
    }

    // Transform the API response to match your format
    const bibleVersions = response.data.data
      .filter(bible => bible.language.id === 'eng') // English only
      .map(bible => ({
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation,
        description: bible.description || `${bible.name} translation`,
        language: bible.language.name,
        copyright: bible.copyright
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    // Cache the versions
    versionCache.set('bibleVersions', bibleVersions);

    const user = await User.findById(req.user.id);
    const currentVersion = user.preferredBibleVersion || 'de4e12af7f28f599-02'; // KJV default

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
    
    // Fallback to basic versions if API fails
    const fallbackVersions = [
      {
        id: 'de4e12af7f28f599-02',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'English',
        description: 'Traditional English translation'
      },
      {
        id: '9879dbb7cfe39e4d-04',
        name: 'World English Bible',
        abbreviation: 'WEB',
        language: 'English',
        description: 'Public domain modern English translation'
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        versions: fallbackVersions,
        currentVersion: 'de4e12af7f28f599-02',
        totalVersions: fallbackVersions.length
      },
      warning: 'Using fallback versions due to API error'
    });
  }
};

// @desc    Update user's preferred Bible version
// @route   PUT /api/reading/bible-version
// @access  Private
exports.updateBibleVersion = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { versionId } = req.body;

    if (!versionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Version ID is required' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.preferredBibleVersion = versionId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Bible version updated successfully',
      preferredBibleVersion: versionId
    });
  } catch (error) {
    console.error('Error updating Bible version:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// @desc    Mark Old Testament reading as complete for a specific date
// @route   PUT /api/reading/complete-old-testament/:year/:month/:day
// @access  Private
exports.markOldTestamentComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { year, month, day } = req.params;

    // Validate date parameters and create date in UTC
    const requestedDate = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(requestedDate.getTime()) || 
        parseInt(day) < 1 || 
        parseInt(day) > new Date(year, month, 0).getDate()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameters'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Calculate reading day based on month and day
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
    const monthRanges = [
  { month: 1, startDay: 1, endDay: 31 },      // Jan
  { month: 2, startDay: 32, endDay: 59 },     // Feb (28 days)
  { month: 3, startDay: 60, endDay: 90 },     // Mar
  { month: 4, startDay: 91, endDay: 120 },    // Apr
  { month: 5, startDay: 121, endDay: 151 },   // May
  { month: 6, startDay: 152, endDay: 181 },   // Jun
  { month: 7, startDay: 182, endDay: 212 },   // Jul
  { month: 8, startDay: 213, endDay: 243 },   // Aug
  { month: 9, startDay: 244, endDay: 273 },   // Sep
  { month: 10, startDay: 274, endDay: 304 },  // Oct
  { month: 11, startDay: 305, endDay: 334 },  // Nov
  { month: 12, startDay: 335, endDay: 365 }   // Dec
];

    const monthRange = monthRanges.find(range => range.month === parsedMonth);
    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: 'Reading plan not defined for this month'
      });
    }

    const readingDay = monthRange.startDay + (parsedDay - 1);
    if (readingDay > monthRange.endDay) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day for this month'
      });
    }

    // Find or create completion record for this day
    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: false,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      dayCompletion.oldTestamentComplete = true;
      if (!dayCompletion.completedAt) {
        dayCompletion.completedAt = new Date();
      }
    }

    // Update booksRead with chapters
    const dayReading = READING_PLAN_DATA.find(r => r.day === readingDay);
    if (dayReading) {
      let otBook = userProgress.booksRead.find(
        b => b.testament === 'Old Testament' && b.book === dayReading.oldTestament.book
      );
      if (!otBook) {
        otBook = {
          testament: 'Old Testament',
          book: dayReading.oldTestament.book,
          completed: false,
          chaptersRead: []
        };
        userProgress.booksRead.push(otBook);
      }
      for (
        let ch = dayReading.oldTestament.startChapter;
        ch <= dayReading.oldTestament.endChapter;
        ch++
      ) {
        if (!otBook.chaptersRead.includes(ch)) otBook.chaptersRead.push(ch);
      }
    }

    // Update overall completion status
    const isFullyComplete = dayCompletion.oldTestamentComplete && dayCompletion.newTestamentComplete;

    // Update current day only if this is the next sequential day AND fully complete
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
      await updateUserStreak(req.user.id, requestedDate);
    }

    res.status(200).json({
      success: true,
      message: 'Old Testament reading marked as complete',
      data: {
        day: parseInt(day),
        readingDay: readingDay,
        date: requestedDate,
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

// @desc    Mark New Testament reading as complete for a specific date
// @route   PUT /api/reading/complete-new-testament/:year/:month/:day
// @access  Private
exports.markNewTestamentComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { year, month, day } = req.params;

    // Validate date parameters and create date in UTC
    const requestedDate = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(requestedDate.getTime()) || 
        parseInt(day) < 1 || 
        parseInt(day) > new Date(year, month, 0).getDate()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameters'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Calculate reading day based on month and day
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
   const monthRanges = [
  { month: 1, startDay: 1, endDay: 31 },      // Jan
  { month: 2, startDay: 32, endDay: 59 },     // Feb (28 days)
  { month: 3, startDay: 60, endDay: 90 },     // Mar
  { month: 4, startDay: 91, endDay: 120 },    // Apr
  { month: 5, startDay: 121, endDay: 151 },   // May
  { month: 6, startDay: 152, endDay: 181 },   // Jun
  { month: 7, startDay: 182, endDay: 212 },   // Jul
  { month: 8, startDay: 213, endDay: 243 },   // Aug
  { month: 9, startDay: 244, endDay: 273 },   // Sep
  { month: 10, startDay: 274, endDay: 304 },  // Oct
  { month: 11, startDay: 305, endDay: 334 },  // Nov
  { month: 12, startDay: 335, endDay: 365 }   // Dec
];

    const monthRange = monthRanges.find(range => range.month === parsedMonth);
    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: 'Reading plan not defined for this month'
      });
    }

    const readingDay = monthRange.startDay + (parsedDay - 1);
    if (readingDay > monthRange.endDay) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day for this month'
      });
    }

    // Find or create completion record for this day
    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: false,
        newTestamentComplete: true,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      dayCompletion.newTestamentComplete = true;
      if (!dayCompletion.completedAt) {
        dayCompletion.completedAt = new Date();
      }
    }

    // Update booksRead with chapters
    const dayReading = READING_PLAN_DATA.find(r => r.day === readingDay);
    if (dayReading) {
      let ntBook = userProgress.booksRead.find(
        b => b.testament === 'New Testament' && b.book === dayReading.newTestament.book
      );
      if (!ntBook) {
        ntBook = {
          testament: 'New Testament',
          book: dayReading.newTestament.book,
          completed: false,
          chaptersRead: []
        };
        userProgress.booksRead.push(ntBook);
      }
      for (
        let ch = dayReading.newTestament.startChapter;
        ch <= dayReading.newTestament.endChapter;
        ch++
      ) {
        if (!ntBook.chaptersRead.includes(ch)) ntBook.chaptersRead.push(ch);
      }
    }

    // Update overall completion status
    const isFullyComplete = dayCompletion.oldTestamentComplete && dayCompletion.newTestamentComplete;

    // Update current day only if this is the next sequential day AND fully complete
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
      await updateUserStreak(req.user.id, requestedDate);
    }

    res.status(200).json({
      success: true,
      message: 'New Testament reading marked as complete',
      data: {
        day: parseInt(day),
        readingDay: readingDay,
        date: requestedDate,
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


// @desc    Mark both Old and New Testament as complete for a specific date
// @route   PUT /api/reading/complete-day/:year/:month/:day
// @access  Private
exports.markDayComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { year, month, day } = req.params;

    const requestedDate = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(requestedDate.getTime()) || 
        parseInt(day) < 1 || 
        parseInt(day) > new Date(year, month, 0).getDate()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameters'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // Calculate reading day based on month and day
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
    const monthRanges = [
  { month: 1, startDay: 1, endDay: 31 },      // Jan
  { month: 2, startDay: 32, endDay: 59 },     // Feb (28 days)
  { month: 3, startDay: 60, endDay: 90 },     // Mar
  { month: 4, startDay: 91, endDay: 120 },    // Apr
  { month: 5, startDay: 121, endDay: 151 },   // May
  { month: 6, startDay: 152, endDay: 181 },   // Jun
  { month: 7, startDay: 182, endDay: 212 },   // Jul
  { month: 8, startDay: 213, endDay: 243 },   // Aug
  { month: 9, startDay: 244, endDay: 273 },   // Sep
  { month: 10, startDay: 274, endDay: 304 },  // Oct
  { month: 11, startDay: 305, endDay: 334 },  // Nov
  { month: 12, startDay: 335, endDay: 365 }   // Dec
];

    const monthRange = monthRanges.find(range => range.month === parsedMonth);
    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: 'Reading plan not defined for this month'
      });
    }

    const readingDay = monthRange.startDay + (parsedDay - 1);
    if (readingDay > monthRange.endDay) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day for this month'
      });
    }

    let dayCompletion = userProgress.completedDays.find(
      completedDay => completedDay.day === readingDay
    );

    if (!dayCompletion) {
      dayCompletion = {
        day: readingDay,
        oldTestamentComplete: true,
        newTestamentComplete: true,
        completedAt: new Date()
      };
      userProgress.completedDays.push(dayCompletion);
    } else {
      dayCompletion.oldTestamentComplete = true;
      dayCompletion.newTestamentComplete = true;
      if (!dayCompletion.completedAt) {
        dayCompletion.completedAt = new Date();
      }
    }

    // Update booksRead
    const dayReading = READING_PLAN_DATA.find(r => r.day === readingDay);
    if (dayReading) {
      let otBook = userProgress.booksRead.find(b => b.testament === 'Old Testament' && b.book === dayReading.oldTestament.book);
      let ntBook = userProgress.booksRead.find(b => b.testament === 'New Testament' && b.book === dayReading.newTestament.book);

      if (!otBook) {
        otBook = { testament: 'Old Testament', book: dayReading.oldTestament.book, completed: false, chaptersRead: [] };
        userProgress.booksRead.push(otBook);
      }
      if (!ntBook) {
        ntBook = { testament: 'New Testament', book: dayReading.newTestament.book, completed: false, chaptersRead: [] };
        userProgress.booksRead.push(ntBook);
      }

      for (let ch = dayReading.oldTestament.startChapter; ch <= dayReading.oldTestament.endChapter; ch++) {
        if (!otBook.chaptersRead.includes(ch)) otBook.chaptersRead.push(ch);
      }
      for (let ch = dayReading.newTestament.startChapter; ch <= dayReading.newTestament.endChapter; ch++) {
        if (!ntBook.chaptersRead.includes(ch)) ntBook.chaptersRead.push(ch);
      }
    }

    // Update current day and percentage
    if (readingDay === userProgress.currentDay) {
      userProgress.currentDay = Math.min(readingDay + 1, 365);
    }
    const fullyCompletedDays = userProgress.completedDays.filter(
      day => day.oldTestamentComplete && day.newTestamentComplete
    ).length;
    userProgress.percentageComplete = Math.round((fullyCompletedDays / 365) * 100);

    await userProgress.save();

    await updateUserStreak(req.user.id, requestedDate);

    res.status(200).json({
      success: true,
      message: 'Day marked as fully complete',
      data: {
        day: parseInt(day),
        readingDay: readingDay,
        date: requestedDate,
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
const updateUserStreak = async (userId, dateCompleted = new Date()) => {
  try {
    let streak = await Streak.findOne({ user: userId });

    if (!streak) {
      streak = new Streak({ user: userId, currentStreak: 1, longestStreak: 1, lastCheckIn: dateCompleted });
    } else {
      // Only increment if this day hasn’t already been recorded
      const lastDate = new Date(streak.lastCheckIn);
      lastDate.setHours(0, 0, 0, 0);
      const today = new Date(dateCompleted);
      today.setHours(0, 0, 0, 0);

      if (lastDate.getTime() !== today.getTime()) {
        streak.currentStreak += 1;

        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }

        streak.lastCheckIn = today;

        // Optionally track in history
        const alreadyInHistory = streak.streakHistory.find(entry => new Date(entry.date).getTime() === today.getTime());
        if (!alreadyInHistory) {
          streak.streakHistory.push({ date: today, streakCount: streak.currentStreak });
        }
      }
    }

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

exports.getProgress = async (req, res, next) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No reading progress found'
      });
    }

    // FIX: Calculate completed books based on fully completed days and reading plan
    const fullyCompletedDays = userProgress.completedDays?.filter(
      day => day.oldTestamentComplete && day.newTestamentComplete
    )?.length || 0;
    
    const totalCompletedDays = userProgress.completedDays?.length || 0;
    const currentDay = userProgress.currentDay || 1;

    // Calculate book progress based on current day (more accurate for frontend selection)
    // Assume roughly 5.5 days per book on average (365 days / 66 books ≈ 5.5)
    const estimatedBooksAccessible = Math.min(Math.floor(currentDay / 5.5), 66);
    const booksFullyCompleted = Math.floor((fullyCompletedDays / 365) * 66);

    // Get list of completed days for frontend reference
    const completedDaysList = (userProgress.completedDays || [])
      .filter(day => day.oldTestamentComplete && day.newTestamentComplete)
      .map(day => day.day)
      .sort((a, b) => a - b);

    res.status(200).json({
      success: true,
      progress: {
        currentDay: currentDay,
        completedDays: fullyCompletedDays,
        totalDaysTracked: totalCompletedDays,
        percentageComplete: userProgress.percentageComplete || 0,
        booksCompleted: booksFullyCompleted,
        booksAccessible: estimatedBooksAccessible, // Books user can potentially select from
        totalBooks: 66,
        completedDaysList: completedDaysList, // Array of completed reading days
        daysPerBook: Math.round((365 / 66) * 10) / 10 // ~5.5 days per book average
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

    // FIX: Filter for fully completed days in the specified year
    const fullyCompletedDaysThisYear = (userProgress.completedDays || []).filter(day => {
      if (!day.completedAt || !day.oldTestamentComplete || !day.newTestamentComplete) return false;
      const completedDate = new Date(day.completedAt);
      return completedDate >= startOfYear && completedDate <= endOfYear;
    });

    // Also track partially completed days for additional insight
    const anyProgressDaysThisYear = (userProgress.completedDays || []).filter(day => {
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
    const yearlyPercentage = Math.round((fullyCompletedDaysThisYear.length / totalDaysInYear) * 100);

    // Calculate streak information for the year
    const completedDaysCount = fullyCompletedDaysThisYear.length;
    const targetDaysForYear = Math.min(daysPassed, totalDaysInYear);

    res.status(200).json({
      success: true,
      yearlyProgress: {
        year: currentYear,
        completedDays: completedDaysCount,
        daysWithAnyProgress: anyProgressDaysThisYear.length,
        totalDaysInYear: totalDaysInYear,
        daysPassed: Math.min(daysPassed, totalDaysInYear),
        percentageComplete: yearlyPercentage,
        averageDaysPerMonth: Math.round((completedDaysCount / 12) * 10) / 10,
        onTrack: completedDaysCount >= (targetDaysForYear * 0.8),
        targetDaysForPeriod: targetDaysForYear
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

    // FIX: Filter for fully completed days in the specified year
    const fullyCompletedDaysThisYear = (userProgress.completedDays || []).filter(day => {
      if (!day.completedAt || !day.oldTestamentComplete || !day.newTestamentComplete) return false;
      const completedDate = new Date(day.completedAt);
      return completedDate >= startOfYear && completedDate <= endOfYear;
    });

    // Also track partially completed days for additional insight
    const anyProgressDaysThisYear = (userProgress.completedDays || []).filter(day => {
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
    const yearlyPercentage = Math.round((fullyCompletedDaysThisYear.length / totalDaysInYear) * 100);

    // Calculate streak information for the year
    const completedDaysCount = fullyCompletedDaysThisYear.length;
    const targetDaysForYear = Math.min(daysPassed, totalDaysInYear);

    res.status(200).json({
      success: true,
      yearlyProgress: {
        year: currentYear,
        completedDays: completedDaysCount,
        daysWithAnyProgress: anyProgressDaysThisYear.length,
        totalDaysInYear: totalDaysInYear,
        daysPassed: Math.min(daysPassed, totalDaysInYear),
        percentageComplete: yearlyPercentage,
        averageDaysPerMonth: Math.round((completedDaysCount / 12) * 10) / 10,
        onTrack: completedDaysCount >= (targetDaysForYear * 0.8),
        targetDaysForPeriod: targetDaysForYear
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



// Reading and Progress
exports.getProgressSummary = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    const streak = await Streak.findOne({ user: req.user.id }) || { currentStreak: 0, longestStreak: 0 };

    const otProgress = userProgress.booksRead.find(b => b.testament === 'Old Testament') || { chaptersRead: [] };
    const ntProgress = userProgress.booksRead.find(b => b.testament === 'New Testament') || { chaptersRead: [] };

    const totalOtChapters = 929;
    const totalNtChapters = 260;

    // Initial calculation from chapters read
    let otPercentage = (otProgress.chaptersRead.length / totalOtChapters) * 100;
    let ntPercentage = (ntProgress.chaptersRead.length / totalNtChapters) * 100;

    // If stored percentages exist, use them as the base
    if (userProgress.otPercentage != null) otPercentage = userProgress.otPercentage;
    if (userProgress.ntPercentage != null) ntPercentage = userProgress.ntPercentage;

    // Apply daily boost if a new day has passed
    const lastBoostDate = userProgress.lastBoostDate || userProgress.createdAt || new Date();
    const today = new Date();
    const daysPassed = Math.floor((today - new Date(lastBoostDate)) / (1000 * 60 * 60 * 24));

    if (daysPassed > 0) {
      const boostAmount = daysPassed * 0.5; // 0.5% per day
      otPercentage = Math.min(otPercentage + boostAmount, 100);
      ntPercentage = Math.min(ntPercentage + boostAmount, 100);

      // Save updated percentages & last boost date
      userProgress.otPercentage = otPercentage;
      userProgress.ntPercentage = ntPercentage;
      userProgress.lastBoostDate = today;
      await userProgress.save();
    }

    res.status(200).json({
      success: true,
      progress: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        readingActivity: {
          oldTestament: {
            percentage: Math.round(otPercentage) || 0,
            chaptersRead: otProgress.chaptersRead.length || 0
          },
          newTestament: {
            percentage: Math.round(ntPercentage) || 0,
            chaptersRead: ntProgress.chaptersRead.length || 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting progress summary:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};



exports.getAchievements = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    const streak = await Streak.findOne({ user: req.user.id }) || { currentStreak: 0 };
    if (!userProgress) {
      return res.status(404).json({ success: false, message: 'No reading progress found' });
    }

    const achievements = [
      { id: '7-day-streak', name: '7 Days Streak', criteria: streak.currentStreak >= 7 },
      { id: '100-chapters', name: '100 Chapters', criteria: userProgress.booksRead.some(b => b.chaptersRead.length >= 100) },
      { id: 'note-taker', name: 'Note Taker', criteria: userProgress.notes.length > 0 },
      { id: '100-highlights', name: '100 Highlights', criteria: (userProgress.highlights || []).length >= 100, locked: true },
      { id: 'consistent-reader', name: 'Consistent Reader', criteria: false, locked: true },
      { id: 'perfect-month', name: 'Perfect Month', criteria: false, locked: true },
      { id: 'quarterly-commitment', name: 'Quarterly Commitment', criteria: false, locked: true },
      { id: 'half-year-devotion', name: 'Half-Year Devotion', criteria: false, locked: true },
      { id: 'bible-daily-hero', name: 'Bible Daily Hero', criteria: false, locked: true }
    ];

    // Determine achievement dates dynamically
    achievements.forEach(achievement => {
      if (achievement.criteria && !achievement.locked) {
        if (achievement.id === '7-day-streak') {
          const streakHistory = streak.streakHistory || [];
          const achievedDate = streakHistory.find(entry => entry.streakCount >= 7)?.date || streak.lastCheckIn;
          achievement.date = achievedDate ? new Date(achievedDate).toISOString().split('T')[0] : null;
        } else if (achievement.id === '100-chapters') {
          const chapterProgress = userProgress.booksRead.find(b => b.chaptersRead.length >= 100);
          achievement.date = chapterProgress?.chaptersRead[99]?.completedAt || userProgress.completedDays[0]?.completedAt || null;
          if (achievement.date) achievement.date = new Date(achievement.date).toISOString().split('T')[0];
        } else if (achievement.id === 'note-taker') {
          achievement.date = userProgress.notes[0]?.createdAt ? new Date(userProgress.notes[0].createdAt).toISOString().split('T')[0] : null;
        } else if (achievement.id === '100-highlights') {
          achievement.date = (userProgress.highlights || [])[99]?.createdAt ? new Date((userProgress.highlights || [])[99].createdAt).toISOString().split('T')[0] : null;
        }
      }
    });

    res.status(200).json({
      success: true,
      achievements: {
        achieved: achievements.filter(a => a.criteria && !a.locked),
        locked: achievements.filter(a => !a.criteria || a.locked)
      }
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


exports.getLeaderboard = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch leaderboard data sorted by currentStreak in descending order, limited to top 10
    const leaderboard = await Streak.find().sort({ currentStreak: -1 }).limit(10).populate('user', 'username');

    const userStreak = await Streak.findOne({ user: req.user.id });
    const userRank = leaderboard.findIndex(s => s.user._id.toString() === req.user.id.toString()) + 1 || -1;

    res.status(200).json({
      success: true,
      leaderboard: leaderboard.map((s, index) => ({
        rank: index + 1,
        username: s.user.username || `User${s.user._id}`,
        days: s.currentStreak
      })),
      userRank: userRank
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};