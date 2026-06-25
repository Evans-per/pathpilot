const mongoose = require('mongoose');

const OnboardingDataSchema = new mongoose.Schema({
  interest: { type: String, trim: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  deadlineValue: { type: Number },
  deadlineUnit: { type: String, enum: ['weeks', 'months'] },
  dailyHours: { type: Number },
  learningStyle: { type: String, enum: ['Videos', 'Reading', 'Projects', 'Mixed'] },
  existingSkills: [{ type: String, trim: true }]
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingData: OnboardingDataSchema,
  points: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  customApiKey: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
