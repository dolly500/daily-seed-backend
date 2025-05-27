const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const passport = require('passport');

const {
  updateProfile,
  updatePassword,
  deleteAccount
} = require('../controllers/userController');

// Middleware
const auth = passport.authenticate('jwt', { session: false });

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