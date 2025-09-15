const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { adminLogin, register, login, getMe, logout } = require('../controllers/authController');
const passport = require('passport');
const auth = require('../middleware/auth');



router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// Admin login route
router.post('/admin/login', 
  [check('email', 'Please include a valid email').isEmail(),
   check('password', 'Password is required').exists()],
  adminLogin);

router.get(
  '/google',
  (req, res, next) => {
    console.log('Initiating Google OAuth...');
    passport.authenticate('google', { scope: ['profile', 'email'] }, (err, user, info) => {
      if (err) {
        console.error('Google auth error:', err);
        return res.status(500).json({ error: 'Failed to initiate Google OAuth', details: err.message });
      }
      if (info) {
        console.log('Google auth info:', info);
      }
      next();
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user || !req.user.id) {
      console.error('No user found in callback:', req.user);
      return res.status(500).json({ error: 'Authentication failed: No user data' });
    }
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
    console.log('JWT generated:', token);
    res.json({ token });
  }
);

router.get('/me', auth, getMe);
router.get('/logout', auth, logout);

module.exports = router;
