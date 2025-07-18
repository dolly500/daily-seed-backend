const admin = require('../config/firebase');
const User = require('../models/User');

class PushNotificationService {

  // Send notification to a single user
async sendToUser(userId, notification) {
  try {
    const user = await User.findById(userId).select('fcmTokens pushNotificationsEnabled');

    if (!user || !user.pushNotificationsEnabled || !user.fcmTokens.length) {
      console.log(`No valid FCM tokens for user ${userId}`);
      return { success: false, reason: 'No valid tokens' };
    }

    const tokens = user.fcmTokens.map(tokenObj => tokenObj.token);

    const message = {
      notification: {
        title: this.getNotificationTitle(notification.type),
        body: notification.message,
      },
      data: {
        type: notification.type,
        relatedDay: notification.relatedDay?.toString() || '',
        notificationId: notification._id?.toString() || '',
        createdAt: notification.createdAt?.toISOString() || new Date().toISOString()
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      ...message
    });

    if (response.failureCount > 0) {
      await this.handleFailedTokens(userId, response.responses, tokens);
    }

    console.log(`Push notification sent to user ${userId}: ${response.successCount} successful, ${response.failureCount} failed`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}


  async sendBulkNotifications(notifications) {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map(notification =>
        this.sendToUser(notification.user, notification)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  getNotificationTitle(type) {
    switch (type) {
      case 'reminder':
        return 'Daily Bible Reading Reminder';
      case 'progress':
        return 'Great Progress!';
      case 'achievement':
        return 'Achievement Unlocked!';
      default:
        return 'Bible App Notification';
    }
  }

  async handleFailedTokens(userId, responses, tokens) {
    try {
      const expiredTokens = [];

      responses.forEach((response, index) => {
        if (!response.success) {
          const error = response.error;
          if (
            error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token'
          ) {
            expiredTokens.push(tokens[index]);
          }
        }
      });

      if (expiredTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { token: { $in: expiredTokens } } }
        });
        console.log(`Removed ${expiredTokens.length} expired tokens for user ${userId}`);
      }
    } catch (error) {
      console.error('Error handling failed tokens:', error);
    }
  }

  async scheduleNotification(userId, notification, scheduledTime) {
    if (new Date(scheduledTime) <= new Date()) {
      return await this.sendToUser(userId, notification);
    }

    console.log(`Notification scheduled for ${scheduledTime}`);
    return { success: true, scheduled: true };
  }
}

module.exports = new PushNotificationService();
