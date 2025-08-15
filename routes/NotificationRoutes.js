const express = require('express');
const router = express.Router();
const { sendAutomaticNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @desc    Send automatic notifications (cron job)
// @route   POST /api/notifications/automatic
// @access  Private
router.post('/automatic', auth, sendAutomaticNotifications);

// @desc    Register/Update Expo push token
// @route   POST /api/notifications/expo-token
// @access  Public or use `auth` if needed
router.post('/expo-token', async (req, res) => {
  try {
    const { userId, token, deviceId, platform } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and Expo push token are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove existing token for this device
    user.expoPushTokens = user.expoPushTokens.filter((t) => t.deviceId !== deviceId);

    // Add new token
    user.expoPushTokens.push({
      token,
      deviceId: deviceId || 'unknown',
      platform: platform || 'unknown',
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Expo push token registered successfully',
    });
  } catch (error) {
    console.error('Error registering Expo push token:', error);
    res.status(500).json({ message: 'Error registering Expo push token' });
  }
});

// @desc    Toggle push notifications
// @route   PUT /api/notifications/toggle-push/:userId
// @access  Public or use `auth` if needed
router.put('/toggle-push/:GenUserId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;

    await User.findByIdAndUpdate(userId, {
      pushNotificationsEnabled: enabled,
    });

    res.status(200).json({
      success: true,
      message: `Push notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
});

module.exports = router;