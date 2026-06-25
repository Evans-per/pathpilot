const mongoose = require('mongoose');

const RecommendedVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoId: { type: String, required: true },
  channel: { type: String, required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  duration: { type: String, required: true }, // Format e.g. PT18M34S
  publishDate: { type: String, required: true },
  score: { type: Number, default: 0 }
}, { _id: false });

const VideoSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  videos: [RecommendedVideoSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Cache auto-expires in 7 days
  }
});

module.exports = mongoose.model('Video', VideoSchema);
