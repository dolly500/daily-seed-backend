const express = require('express');
const router = express.Router();
const { sendAutomaticNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @desc    Send automatic notifications (cron job)
// @route   POST /api/notifications/automatic
// @access  Private
router.post('/automatic', auth, sendAutomaticNotifications);

// @desc    Register/Update FCM token
// @route   POST /api/notifications/fcm-token
// @access  Public or use `auth` if needed
router.post('/fcm-token', async (req, res) => {
  try {
    const { userId, token, deviceId, platform } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and FCM token are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove existing token for this device
    user.fcmTokens = user.fcmTokens.filter(t => t.deviceId !== deviceId);

    // Add new token
    user.fcmTokens.push({
      token,
      deviceId: deviceId || 'unknown',
      platform: platform || 'unknown'
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully'
    });

  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ message: 'Error registering FCM token' });
  }
});

// @desc    Toggle push notifications
// @route   PUT /api/notifications/toggle-push/:userId
// @access  Public or use `auth` if needed
router.put('/toggle-push/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;

    await User.findByIdAndUpdate(userId, {
      pushNotificationsEnabled: enabled
    });

    res.status(200).json({
      success: true,
      message: `Push notifications ${enabled ? 'enabled' : 'disabled'}`
    });

  } catch (error) {
    console.error('Error toggling push notifications:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
});

module.exports = router;
