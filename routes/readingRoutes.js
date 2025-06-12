const express = require('express');
const router = express.Router();
const passport = require('passport');

const {
  getStreak,
  getProgress,
  initUserProgress,
  getStreakHistory,
  getReadingByDay,
  getBibleVersions,
  markOldTestamentComplete,
  markNewTestamentComplete,
  markDayComplete,
  // Calendar and progress routes
  getCalendarData,
  getYearlyProgress,
  // Notes routes
  addNote,
  getNotes,
  updateNote,
  deleteNote,

  // hightlights
  addHighlight,
  getHighlights,
  deleteHighlight,
} = require('../controllers/readingController');

// Middleware
const auth = passport.authenticate('jwt', { session: false });

// Basic reading routes
router.post('/init', auth, initUserProgress);
router.get('/day/:year/:month/:day', auth, getReadingByDay);
router.get('/streak', auth, getStreak);
router.get('/streak-history', auth, getStreakHistory);
router.get('/bible-versions', auth, getBibleVersions);
router.put('/complete-old-testament/:day', auth, markOldTestamentComplete);
router.put('/complete-new-testament/:day', auth, markNewTestamentComplete);
router.put('/complete-day/:day', auth, markDayComplete);
router.get('/calendar/:year/:month', auth, getCalendarData)

// no of books out of 66 books
router.get('/progress', auth, getProgress);




// yearly progress routes
router.get('/yearly-progress/:year?', auth, getYearlyProgress);


// Notes routes
router.post('/notes', auth, addNote);
router.get('/notes/:id', auth, getNotes);
router.get('/notes', auth, getNotes);
router.put('/notes/:id', auth, updateNote);
router.delete('/notes/:id', auth, deleteNote);


// highlight routes
router.post('/highlights', auth, addHighlight);
router.get('/highlights', auth, getHighlights);
router.delete('/highlights/:id', auth, deleteHighlight)

module.exports = router;