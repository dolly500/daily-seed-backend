const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send password reset code
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification code has been sent.'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    
    // Hash the code before saving to database for security
    const hashedCode = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');

    // Set verification code and expiration (10 minutes)
    user.passwordResetCode = hashedCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Verification Code',
        verificationCode: verificationCode
      });

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email successfully'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clear verification code if email fails
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// @desc    Verify reset code
// @route   POST /api/users/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, code } = req.body;

    // Hash the provided code to compare with database
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // Find user with valid reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code is valid'
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    next(error);
  }
};

// @desc    Reset password with code
// @route   PUT /api/users/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, code, newPassword } = req.body;

    // Hash the provided code to compare with database
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // Find user with valid reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

// @desc    Resend verification code
// @route   POST /api/users/resend-reset-code
// @access  Public
exports.resendResetCode = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a new verification code has been sent.'
      });
    }

    // Check if user can request a new code (prevent spam)
    const timeSinceLastRequest = user.passwordResetExpires ? 
      (user.passwordResetExpires - Date.now()) : 0;
    
    if (timeSinceLastRequest > 8 * 60 * 1000) { // If more than 8 minutes left
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new code'
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    
    // Hash the code before saving
    const hashedCode = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');

    // Update verification code and expiration
    user.passwordResetCode = hashedCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'New Password Reset Verification Code',
        verificationCode: verificationCode
      });

      res.status(200).json({
        success: true,
        message: 'New verification code sent successfully'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Resend reset code error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, preferredBibleVersion } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    // Update fields
    if (username) user.username = username;
    if (preferredBibleVersion) user.preferredBibleVersion = preferredBibleVersion;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferredBibleVersion: user.preferredBibleVersion,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (user.password) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
    } else {
      // If user has no password (Google auth), set a new one
      user.password = newPassword;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Password set successfully'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};