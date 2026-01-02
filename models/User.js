const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      minlength: 6,
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: {
      type: String
    },
    preferredBibleVersion: {
      type: String,
      default: 'de4e12af7f28f599-02' // KJV from Scripture API
    },
    // Store additional Bible version metadata for quick access
    bibleVersionMetadata: {
      id: {
        type: String,
        default: 'de4e12af7f28f599-02'
      },
      name: {
        type: String,
        default: 'King James Version'
      },
      abbreviation: {
        type: String,
        default: 'KJV'
      },
      language: {
        type: String,
        default: 'English'
      }
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    passwordResetCode: {
      type: String,
      select: false 
    },
    passwordResetExpires: {
      type: Date,
      select: false 
    },
    lastNotificationSent: {
      type: Date,
      default: null
    },
    // Push notification fields
    expoPushTokens: [
      {
        token: String, // Store Expo push token
        deviceId: String,
        platform: {
          type: String,
          enum: ['ios', 'android'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pushNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    // Reading preferences
    readingPreferences: {
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      readingMode: {
        type: String,
        enum: ['light', 'dark', 'sepia'],
        default: 'light'
      },
      verseNumbersVisible: {
        type: Boolean,
        default: true
      },
      dailyReminderTime: {
        type: String, // Format: "HH:MM" (24-hour)
        default: '08:00'
      },
      dailyReminderEnabled: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  // Only hash password if it exists
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Match entered password to hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update Bible version with metadata
UserSchema.methods.updateBibleVersion = async function(versionData) {
  this.preferredBibleVersion = versionData.id;
  this.bibleVersionMetadata = {
    id: versionData.id,
    name: versionData.name,
    abbreviation: versionData.abbreviation,
    language: versionData.language || 'English'
  };
  return await this.save();
};

// Migration helper: Convert old version codes to new Scripture API IDs
UserSchema.statics.migrateOldVersionCodes = async function() {
  const versionMap = {
    'kjv': 'de4e12af7f28f599-02',
    'web': '9879dbb7cfe39e4d-04',
    'net': '107909fe18b5b899-01',
    'nasb': 'f72b840c855f362c-04',
    'niv': '78a9f6124f344018-01',
    'esv': 'f421fe261da7624f-01',
    'nlt': 'de4e12af7f28f599-01',
    'msg': '65eec8e0b60e656b-01'
  };

  const users = await this.find({
    preferredBibleVersion: { $in: Object.keys(versionMap) }
  });

  for (const user of users) {
    const oldVersion = user.preferredBibleVersion.toLowerCase();
    if (versionMap[oldVersion]) {
      user.preferredBibleVersion = versionMap[oldVersion];
      await user.save();
    }
  }

  console.log(`Migrated ${users.length} users to new Bible version format`);
};

module.exports = mongoose.model('User', UserSchema);