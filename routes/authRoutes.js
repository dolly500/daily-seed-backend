const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { adminLogin, register, login, getMe, logout } = require('../controllers/authController');
const passport = require('passport');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = require('../models/User');

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Missing idToken' });
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        username: payload.name,
      });
    }

    // Generate your own JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed', error: error.message });
  }
});


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
    // Store the client type (web/mobile) in session or query param
    req.session = req.session || {};
    req.session.clientType = req.query.client || 'web';
    
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
    
    // Check if request is from mobile app
    const clientType = req.session?.clientType || req.query.client || 'web';
    const isMobile = clientType === 'mobile';
    
    if (isMobile) {
      // Redirect to mobile app with token
      const mobileRedirectUri = process.env.MOBILE_REDIRECT_URI;
      const redirectUrl = `${mobileRedirectUri}?token=${encodeURIComponent(token)}&success=true`;
      console.log('Redirecting to mobile app:', redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      // For web clients, return JSON (or redirect to frontend)
      const frontendUrl = process.env.FRONTEND_URL;
      const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;
      return res.redirect(redirectUrl);
    }
  }
);

router.get('/me', auth, getMe);
router.get('/logout', auth, logout);

module.exports = router;