const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const Progress = require('../models/Progress');
const openaiService = require('../services/openaiService');

/**
 * Generate a new learning roadmap based on user onboarding profile
 */
exports.generateUserRoadmap = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.onboardingData || !user.onboardingData.interest) {
      return res.status(400).json({ message: 'Please complete the onboarding questionnaire first.' });
    }

    console.log(`Generating AI roadmap for user: ${user.email} (Interest: ${user.onboardingData.interest})`);
    
    // Call OpenAI Service (features offline mock auto-fallback)
    const generatedPlan = await openaiService.generateRoadmap(user.onboardingData, user.customApiKey);

    // Save to database
    const roadmap = await Roadmap.create({
      userId: user._id,
      summary: generatedPlan.summary,
      roadmap: generatedPlan.roadmap
    });

    // Reset Progress for this new roadmap but preserve historical stats (logs & videos)
    const oldProgress = await Progress.findOne({ userId: user._id });
    const existingLogs = oldProgress ? oldProgress.studyLogs : [];
    const existingVideos = oldProgress ? oldProgress.savedVideos : [];

    await Progress.findOneAndDelete({ userId: user._id });
    const progress = await Progress.create({
      userId: user._id,
      roadmapId: roadmap._id,
      completedTasks: [],
      studyLogs: existingLogs,
      savedVideos: existingVideos
    });

    // Mark onboarding complete now that roadmap is saved
    user.onboardingCompleted = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Roadmap generated and progress tracker initialized!',
      roadmap,
      progress,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        onboardingData: user.onboardingData,
        points: user.points,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch the user's latest active learning roadmap
 */
exports.getUserRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'No learning roadmap found. Please onboarding first.' });
    }

    res.status(200).json({
      success: true,
      roadmap
    });
  } catch (error) {
    next(error);
  }
};
