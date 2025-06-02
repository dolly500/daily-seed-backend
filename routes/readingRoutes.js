const express = require('express');
const router = express.Router();
const passport = require('passport');

const {
  getStreak,
  getProgress,
  initUserProgress,
  getStreakHistory,
  getReadingByDay,
  // Calendar and progress routes
  getYearlyProgress,
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
router.get('/streak', auth, getStreak);
router.get('/streak-history', auth, getStreakHistory);
router.get('/progress', auth, getProgress);
router.get('/day/:year/:month/:day', auth, getReadingByDay);


// Calendar and detailed progress routes
router.get('/yearly-progress/:year?', auth, getYearlyProgress);


// Notes routes
router.post('/notes', auth, addNote);
router.get('/notes/:id', auth, getNotes);
router.get('/notes', auth, getNotes);
router.put('/notes/:id', auth, updateNote);
router.delete('/notes/:id', auth, deleteNote);

module.exports = router;