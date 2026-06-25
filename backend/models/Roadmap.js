const mongoose = require('mongoose');

const RoadmapWeekSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  goal: { type: String, required: true },
  topics: [{ type: String, required: true }],
  concepts: [{ type: String }],
  practice: [{ type: String }],
  mini_project: { type: String },
  estimated_hours: { type: Number, default: 0 }
}, { _id: false });

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true
  },
  roadmap: [RoadmapWeekSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
