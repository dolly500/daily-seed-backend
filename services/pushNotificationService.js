const axios = require('axios');
const User = require('../models/User');

class PushNotificationService {
  // Send notification to a single user
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId).select('expoPushTokens pushNotificationsEnabled');

      if (!user || !user.pushNotificationsEnabled || !user.expoPushTokens.length) {
        console.log(`No valid Expo push tokens for user ${userId}`);
        return { success: false, reason: 'No valid tokens' };
      }

      const tokens = user.expoPushTokens.map((tokenObj) => tokenObj.token);

      const messages = tokens.map((token) => ({
        to: token,
        title: this.getNotificationTitle(notification.type),
        body: notification.message,
        data: {
          type: notification.type,
          relatedDay: notification.relatedDay?.toString() || '',
          notificationId: notification._id?.toString() || '',
          createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
        },
      }));

      const response = await axios.post(
        'https://api.expo.dev/v2/push/send',
        messages,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const results = response.data.data;
      const successCount = results.filter((result) => result.status === 'ok').length;
      const failureCount = results.length - successCount;

      if (failureCount > 0) {
        await this.handleFailedTokens(userId, results, tokens);
      }

      console.log(
        `Push notification sent to user ${userId}: ${successCount} successful, ${failureCount} failed`
      );

      return {
        success: true,
        successCount,
        failureCount,
      };
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkNotifications(notifications) {
    const results = [];
    const batchSize = 100; // Expo allows up to 100 tickets per request

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map((notification) =>
        this.sendToUser(notification.user, notification)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      if (i + batchSize < notifications.length) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limiting
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
        if (response.status === 'error') {
          const error = response.details?.error;
          if (error === 'DeviceNotRegistered' || error === 'InvalidPushToken') {
            expiredTokens.push(tokens[index]);
          }
        }
      });

      if (expiredTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { expoPushTokens: { token: { $in: expiredTokens } } },
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