const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Automatically delete sessions after 30 days (30 * 24 * 60 * 60 seconds)
  }
});

module.exports = mongoose.model('Session', SessionSchema);
