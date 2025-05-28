// routes/users.js - Updated with all controller functions
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const passport = require('passport');

const {
  forgotPassword,
  verifyResetCode,
  resetPassword,
  resendResetCode,
  updateProfile,
  updatePassword,
  deleteAccount
} = require('../controllers/userController');

// Middleware
const auth = passport.authenticate('jwt', { session: false });

// @route   POST /api/users/forgot-password
// @desc    Send password reset code
// @access  Public
router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
  ],
  forgotPassword
);

// @route   POST /api/users/verify-reset-code
// @desc    Verify reset code
// @access  Public
router.post(
  '/verify-reset-code',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('code', 'Verification code is required').not().isEmpty().isLength({ min: 6, max: 6 })
  ],
  verifyResetCode
);

// @route   PUT /api/users/reset-password
// @desc    Reset password with code
// @access  Public
router.put(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('code', 'Verification code is required').not().isEmpty().isLength({ min: 6, max: 6 }),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  resetPassword
);

// @route   POST /api/users/resend-reset-code
// @desc    Resend verification code
// @access  Public
router.post(
  '/resend-reset-code',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
  ],
  resendResetCode
);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    [
      check('username', 'Username is required').optional(),
      check('preferredBibleVersion', 'Bible version must be valid').optional()
    ]
  ],
  updateProfile
);

// @route   PUT /api/users/password
// @desc    Update password
// @access  Private
router.put(
  '/password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').exists(),
      check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  updatePassword
);

// @route   DELETE /api/users
// @desc    Delete user account
// @access  Private
router.delete('/', auth, deleteAccount);

module.exports = router;