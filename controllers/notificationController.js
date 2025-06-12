const Notification = require('../models/Notification');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const PushNotificationService = require('../services/pushNotificationService');

// Updated sendAutomaticNotifications function
exports.sendAutomaticNotifications = async (req, res) => {
  try {
    console.log('Starting automatic notifications...');
    const startTime = Date.now();
    
    // Get all users with their streak data in one query using populate
    const users = await UserProgress.find()
      .populate('user', '_id')
      .lean();
    
    console.log(`Found ${users.length} users to process`);
    
    if (users.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No users found to process',
        processed: 0,
        duration: `${Date.now() - startTime}ms`
      });
    }

    // Get all streaks at once
    const userIds = users.map(u => u.user._id || u.user);
    const streaks = await Streak.find({ user: { $in: userIds } }).lean();
    
    // Create a map for quick streak lookup
    const streakMap = {};
    streaks.forEach(streak => {
      streakMap[streak.user.toString()] = streak;
    });

    const notifications = [];
    const today = new Date();
    
    // Process users in batches to avoid memory issues
    const batchSize = 50;
    let processed = 0;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      for (const progress of batch) {
        try {
          const userId = progress.user._id || progress.user;
          const streak = streakMap[userId.toString()];
          
          const lastCompleted = progress.completedDays.length > 0 
            ? progress.completedDays[progress.completedDays.length - 1].completedAt 
            : null;
          
          const daysSinceLast = lastCompleted 
            ? Math.floor((today - new Date(lastCompleted)) / (1000 * 60 * 60 * 24))
            : 7;

          let notificationToSend = null;

          // Streak reminder - only if streak exists and has current streak > 0
          if (daysSinceLast > 1 && streak && streak.currentStreak > 0) {
            notificationToSend = {
              user: userId,
              type: 'reminder',
              message: 'Don\'t lose your streak! Complete today\'s passage to keep it alive',
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            notifications.push(notificationToSend);
          }

          // Progress notifications
          if (progress.percentageComplete >= 25 && 
              !progress.completedDays.some(d => d.day === progress.currentDay)) {
            notificationToSend = {
              user: userId,
              type: 'progress',
              message: 'You\'re on a roll! Keep it up! Every day you grow stronger in the Word',
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            notifications.push(notificationToSend);
          }

          // Achievement notifications
          if (progress.percentageComplete === 50) {
            notificationToSend = {
              user: userId,
              type: 'achievement',
              message: 'Amazing! You\'ve finished the Old Testament',
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            notifications.push(notificationToSend);
          }

          if (progress.percentageComplete === 100) {
            notificationToSend = {
              user: userId,
              type: 'achievement',
              message: 'Good! You\'ve finished the New Testament',
              relatedDay: progress.currentDay,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            notifications.push(notificationToSend);
          }
          
          processed++;
        } catch (userError) {
          console.error(`Error processing user ${progress.user}:`, userError);
        }
      }
    }

    // Bulk insert all notifications at once
    let createdCount = 0;
    let pushResults = [];
    
    if (notifications.length > 0) {
      // Save to database
      const savedNotifications = await Notification.insertMany(notifications, { ordered: false });
      createdCount = savedNotifications.length;
      console.log(`Created ${createdCount} notifications in database`);
      
      // Send push notifications
      console.log('Sending push notifications...');
      pushResults = await PushNotificationService.sendBulkNotifications(savedNotifications);
      
      const successfulPush = pushResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      console.log(`Push notifications: ${successfulPush} successful out of ${pushResults.length}`);
    }

    const duration = Date.now() - startTime;
    console.log(`Automatic notifications completed in ${duration}ms`);
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Automatic notifications processed successfully',
      processed: processed,
      notificationsCreated: createdCount,
      pushNotificationsSent: pushResults.filter(r => r.status === 'fulfilled' && r.value.success).length,
      duration: `${duration}ms`
    });
    
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing automatic notifications',
      error: error.message 
    });
  }
};