const cron = require('node-cron');
const NotificationController = require('../controllers/notificationController');

class NotificationScheduler {
  constructor() {
    this.jobs = new Map();
  }

  startScheduledJobs() {
    console.log('Starting notification scheduler...');

    // Daily reminder notifications at 9:00 AM
    this.scheduleJob('daily-reminders', '0 9 * * *', () => {
      console.log('Running daily reminder notifications...');
      this.sendNotifications('daily');
    });

    // Weekly progress check on Sundays at 6:00 PM
    this.scheduleJob('weekly-progress', '0 18 * * 0', () => {
      console.log('Running weekly progress notifications...');
      this.sendNotifications('weekly');
    });

    // Achievement check twice daily at 12:00 PM and 8:00 PM
    this.scheduleJob('achievement-check', '0 12,20 * * *', () => {
      console.log('Running achievement notifications...');
      this.sendNotifications('achievement');
    });

    // Streak reminder at 8:00 PM daily
    this.scheduleJob('streak-reminder', '0 20 * * *', () => {
      console.log('Running streak reminder notifications...');
      this.sendNotifications('streak');
    });

    console.log('All notification jobs scheduled successfully');
  }

  scheduleJob(jobName, cronExpression, task) {
    const job = cron.schedule(cronExpression, task, {
      scheduled: true,
      timezone: 'Africa/Lagos',
    });

    this.jobs.set(jobName, job);
    console.log(`Scheduled job: ${jobName} with cron: ${cronExpression}`);
  }

  async sendNotifications(type = 'all') {
    try {
      const mockReq = {
        body: { type },
        query: { automated: true },
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`Notification job completed with status ${code}:`, data);
            return data;
          },
        }),
      };

      await NotificationController.sendAutomaticNotifications(mockReq, mockRes);
    } catch (error) {
      console.error('Error in scheduled notification job:', error);
    }
  }

  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`Stopped job: ${jobName}`);
    }
  }

  stopAllJobs() {
    this.jobs.forEach((job, jobName) => {
      job.stop();
      console.log(`Stopped job: ${jobName}`);
    });
    this.jobs.clear();
  }

  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, jobName) => {
      status[jobName] = {
        running: job.running,
        scheduled: job.scheduled,
      };
    });
    return status;
  }
}

module.exports = new NotificationScheduler();