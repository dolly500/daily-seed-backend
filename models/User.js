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
      type: String
    },
    avatar: {
      type: String
    },
    preferredBibleVersion: {
      type: String,
      default: 'KJV'
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
    },lastNotificationSent: {
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
    }
  },
  {
    timestamps: true
  },
  
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

module.exports = mongoose.model('User', UserSchema);
