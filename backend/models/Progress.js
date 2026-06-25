const mongoose = require('mongoose');

const CompletedTaskSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  taskType: { type: String, enum: ['topic', 'practice', 'mini_project'], required: true },
  taskName: { type: String, required: true }
}, { _id: false });

const StudyLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format YYYY-MM-DD
  hours: { type: Number, required: true }
}, { _id: false });

const SavedVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  channel: { type: String, required: true }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  completedTasks: [CompletedTaskSchema],
  studyLogs: [StudyLogSchema],
  savedVideos: [SavedVideoSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', ProgressSchema);
