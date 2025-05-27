const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCheckIn: {
      type: Date
    },
    streakHistory: [
      {
        date: {
          type: Date,
          required: true
        },
        streakCount: {
          type: Number,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);


StreakSchema.methods.updateStreak = function (checkInDate = new Date()) {
  const today = new Date(checkInDate);
  today.setHours(0, 0, 0, 0);

  const hasCheckedInToday = this.lastCheckIn && new Date(this.lastCheckIn).setHours(0, 0, 0, 0) === today.getTime();
  if (hasCheckedInToday) return;

  // First-time check-in
  if (!this.lastCheckIn) {
    this.currentStreak = 1;
    this.longestStreak = 1;
    this.lastCheckIn = today;
    this.streakHistory.push({ date: today, streakCount: 1 });
    return;
  }

  const lastDate = new Date(this.lastCheckIn);
  lastDate.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) {
    // Continued streak
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else if (dayDiff > 1) {
    // Missed days
    this.currentStreak = 1;
  }

  this.lastCheckIn = today;

  const existingEntry = this.streakHistory.find(entry => new Date(entry.date).getTime() === today.getTime());
  if (!existingEntry) {
    this.streakHistory.push({ date: today, streakCount: this.currentStreak });
  }
};

module.exports = mongoose.model('Streak', StreakSchema);
