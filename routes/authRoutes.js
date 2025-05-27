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
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${token}`);
  }
);

router.get('/me', auth, getMe);
router.get('/logout', auth, logout);

module.exports = router;
