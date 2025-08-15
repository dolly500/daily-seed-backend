const Notification = require('../models/Notification');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const User = require('../models/User');
const PushNotificationService = require('../services/pushNotificationService');

exports.sendAutomaticNotifications = async (req, res) => {
  try {
    console.log('Starting automatic notifications...');
    const startTime = Date.now();

    const isAutomated = req.query?.automated === 'true';
    const notificationType = req.body?.type || 'all';

    // Update to check expoPushTokens instead of fcmTokens
    const users = await UserProgress.find()
      .populate({
        path: 'user',
        select: '_id pushNotificationsEnabled expoPushTokens timezone lastNotificationSent',
        match: {
          pushNotificationsEnabled: true,
          expoPushTokens: { $exists: true, $ne: [] },
        },
      })
      .lean();

    const eligibleUsers = users.filter((user) => user.user !== null);

    console.log(
      `Found ${eligibleUsers.length} users eligible for notifications (out of ${users.length} total)`
    );

    if (eligibleUsers.length === 0) {
      const response = {
        success: true,
        message: 'No users found with push notifications enabled',
        processed: 0,
        duration: `${Date.now() - startTime}ms`,
      };

      if (isAutomated) {
        console.log('Automated notification result:', response);
        return response;
      }

      return res.status(200).json(response);
    }

    const userIds = eligibleUsers.map((u) => u.user._id || u.user);
    const streaks = await Streak.find({ user: { $in: userIds } }).lean();

    const streakMap = {};
    streaks.forEach((streak) => {
      streakMap[streak.user.toString()] = streak;
    });

    const notifications = [];
    const today = new Date();

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < eligibleUsers.length; i += batchSize) {
      const batch = eligibleUsers.slice(i, i + batchSize);

      for (const progress of batch) {
        try {
          const userId = progress.user._id || progress.user;
          const userObj = progress.user;
          const streak = streakMap[userId.toString()];

          const lastCompleted =
            progress.completedDays.length > 0
              ? progress.completedDays[progress.completedDays.length - 1].completedAt
              : null;

          const daysSinceLast = lastCompleted
            ? Math.floor((today - new Date(lastCompleted)) / (1000 * 60 * 60 * 24))
            : 7;

          const lastNotificationSent = userObj.lastNotificationSent
            ? new Date(userObj.lastNotificationSent)
            : null;
          const hoursSinceLastNotification = lastNotificationSent
            ? Math.floor((today - lastNotificationSent) / (1000 * 60 * 60))
            : 24;

          if (isAutomated && hoursSinceLastNotification < 4) {
            continue;
          }

          let notificationToSend = null;

          if (
            (notificationType === 'all' || notificationType === 'streak') &&
            daysSinceLast > 1 &&
            streak &&
            streak.currentStreak > 0
          ) {
            notificationToSend = {
              user: userId,
              type: 'reminder',
              message: "Don't lose your streak! Complete today's passage to keep it alive",
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            notifications.push(notificationToSend);
          }

          if (
            (notificationType === 'all' || notificationType === 'daily') &&
            progress.percentageComplete >= 25 &&
            !progress.completedDays.some((d) => d.day === progress.currentDay)
          ) {
            notificationToSend = {
              user: userId,
              type: 'progress',
              message: "You're on a roll! Keep it up! Every day you grow stronger in the Word",
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            notifications.push(notificationToSend);
          }

          if (notificationType === 'all' || notificationType === 'achievement') {
            const existingAchievements = await Notification.find({
              user: userId,
              type: 'achievement',
              $or: [
                { message: "Amazing! You've finished the Old Testament" },
                { message: "Good! You've finished the New Testament" },
              ],
            }).lean();

            const hasOldTestamentAchievement = existingAchievements.some((n) =>
              n.message.includes('Old Testament')
            );
            const hasNewTestamentAchievement = existingAchievements.some((n) =>
              n.message.includes('New Testament')
            );

            if (progress.percentageComplete === 50 && !hasOldTestamentAchievement) {
              notificationToSend = {
                user: userId,
                type: 'achievement',
                message: "Amazing! You've finished the Old Testament",
                relatedDay: progress.currentDay,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              notifications.push(notificationToSend);
            }

            if (progress.percentageComplete === 100 && !hasNewTestamentAchievement) {
              notificationToSend = {
                user: userId,
                type: 'achievement',
                message: "Good! You've finished the New Testament",
                relatedDay: progress.currentDay,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              notifications.push(notificationToSend);
            }
          }

          processed++;
        } catch (userError) {
          console.error(`Error processing user ${progress.user}:`, userError);
        }
      }
    }

    let createdCount = 0;
    let pushResults = [];

    if (notifications.length > 0) {
      const savedNotifications = await Notification.insertMany(notifications, { ordered: false });
      createdCount = savedNotifications.length;
      console.log(`Created ${createdCount} notifications in database`);

      console.log('Sending push notifications...');
      pushResults = await PushNotificationService.sendBulkNotifications(savedNotifications);

      const successfulPush = pushResults.filter(
        (result) => result.status === 'fulfilled' && result.value.success
      ).length;

      console.log(
        `Push notifications: ${successfulPush} successful out of ${pushResults.length}`
      );

      const notifiedUserIds = [...new Set(notifications.map((n) => n.user))];
      await User.updateMany(
        { _id: { $in: notifiedUserIds } },
        { lastNotificationSent: new Date() }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`Automatic notifications completed in ${duration}ms`);

    const response = {
      success: true,
      message: 'Automatic notifications processed successfully',
      totalUsers: users.length,
      eligibleUsers: eligibleUsers.length,
      processed: processed,
      notificationsCreated: createdCount,
      pushNotificationsSent: pushResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length,
      duration: `${duration}ms`,
      automated: isAutomated,
      type: notificationType,
    };

    if (isAutomated) {
      console.log('Automated notification result:', response);
      return response;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error sending notifications:', error);
    const errorResponse = {
      success: false,
      message: 'Error processing automatic notifications',
      error: error.message,
    };

    if (isAutomated) {
      console.error('Automated notification error:', errorResponse);
      return errorResponse;
    }

    res.status(500).json(errorResponse);
  }
};

// Function to handle different notification types
exports.sendNotificationByType = async (type) => {
  const mockReq = {
    body: { type },
    query: { automated: 'true' },
  };

  const mockRes = {
    status: () => ({ json: () => {} }),
  };

  return await this.sendAutomaticNotifications(mockReq, mockRes);
};

// Function to get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastSent: { $max: '$createdAt' },
        },
      },
    ]);

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};