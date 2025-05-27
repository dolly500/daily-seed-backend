const express = require('express');
const router = express.Router();
const passport = require('passport');

const {
  getTodaysReading,
  markReadingComplete,
  markDayComplete,
  getStreak,
  getProgress,
  getPassage,
  initUserProgress,
  getStreakHistory,
  getReadingByDay,
  // Calendar and progress routes
  getCalendarData,
  getYearlyProgress,
  getDailyStatus,
  // Notes routes
  addNote,
  getNotes,
  updateNote,
  deleteNote
} = require('../controllers/readingController');

// Middleware
const auth = passport.authenticate('jwt', { session: false });

// Basic reading routes
router.post('/init', auth, initUserProgress);
router.get('/today', auth, getTodaysReading);
router.post('/complete', auth, markReadingComplete);
router.post('/complete/:day', auth, markDayComplete);
router.get('/streak', auth, getStreak);
router.get('/streak-history', auth, getStreakHistory);
router.get('/progress', auth, getProgress);
router.get('/passage/:version/:book/:chapter', auth, getPassage);
router.get('/day/:day', auth, getReadingByDay);


// Calendar and detailed progress routes
router.get('/calendar/:year/:month', auth, getCalendarData);
router.get('/yearly-progress/:year?', auth, getYearlyProgress);
router.get('/daily-status', auth, getDailyStatus);

// Notes routes
router.post('/notes', auth, addNote);
router.get('/notes/:id', auth, getNotes);
router.get('/notes', auth, getNotes);
router.put('/notes/:id', auth, updateNote);
router.delete('/notes/:id', auth, deleteNote);

module.exports = router;