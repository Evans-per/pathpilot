const openaiService = require('../services/openaiService');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const User = require('../models/User');

/**
 * Helper: fetch user, roadmap, progress and compute current active week
 */
const getUserContext = async (userId) => {
  const user = await User.findById(userId).select('-password');
  const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
  let progress = null;
  let currentWeek = 1;

  if (roadmap) {
    progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
    const totalWeeks = roadmap.roadmap.length;
    for (let w = 1; w <= totalWeeks; w++) {
      const weekData = roadmap.roadmap.find(item => item.week === w);
      if (!weekData) continue;
      const totalItems =
        (weekData.topics?.length || 0) +
        (weekData.practice?.length || 0) +
        (weekData.mini_project ? 1 : 0);
      const completed = progress
        ? progress.completedTasks.filter(t => t.week === w).length
        : 0;
      if (completed < totalItems) {
        currentWeek = w;
        break;
      }
      currentWeek = totalWeeks;
    }
  }

  return { user, roadmap, progress, currentWeek };
};

/**
 * POST /ai/quiz
 * Generate a 10-question personalised quiz for the current week
 */
exports.generateQuiz = async (req, res, next) => {
  try {
    const { user, roadmap, currentWeek } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const weekData = roadmap.roadmap.find(w => w.week === currentWeek);
    const result = await openaiService.generateQuiz(
      weekData,
      user.onboardingData?.interest || 'General Technology',
      user.onboardingData?.level || 'Beginner',
      user.customApiKey
    );

    res.status(200).json({
      success: true,
      currentWeek,
      weekGoal: weekData?.goal || '',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /ai/notes
 * Generate structured study notes for the current week's topics
 */
exports.generateNotes = async (req, res, next) => {
  try {
    const { user, roadmap, currentWeek } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const weekData = roadmap.roadmap.find(w => w.week === currentWeek);
    const result = await openaiService.generateNotes(
      weekData?.topics || [],
      weekData?.concepts || [],
      user.onboardingData?.interest || 'General Technology',
      user.onboardingData?.level || 'Beginner',
      user.customApiKey
    );

    res.status(200).json({
      success: true,
      currentWeek,
      weekGoal: weekData?.goal || '',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /ai/flashcards
 * Generate active-recall flashcards for the current week
 */
exports.generateFlashcards = async (req, res, next) => {
  try {
    const { user, roadmap, currentWeek } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const weekData = roadmap.roadmap.find(w => w.week === currentWeek);
    const result = await openaiService.generateFlashcards(
      weekData?.topics || [],
      weekData?.concepts || [],
      user.onboardingData?.interest || 'General Technology',
      user.onboardingData?.level || 'Beginner',
      user.customApiKey
    );

    res.status(200).json({
      success: true,
      currentWeek,
      weekGoal: weekData?.goal || '',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /ai/daily-plan
 * Generate today's adaptive study schedule
 */
exports.getDailyPlan = async (req, res, next) => {
  try {
    const { user, roadmap, progress, currentWeek } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const weekData = roadmap.roadmap.find(w => w.week === currentWeek);
    const result = openaiService.generateDailyPlan(
      user.onboardingData,
      weekData,
      progress?.completedTasks || []
    );

    res.status(200).json({
      success: true,
      currentWeek,
      weekGoal: weekData?.goal || '',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /ai/analytics
 * Compute progress analytics: velocity, predicted finish, focus area, motivation
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { user, roadmap, progress } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const result = openaiService.generateProgressAnalytics(
      user.onboardingData,
      progress,
      roadmap
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /ai/project-ideas
 * Suggest weekly project ideas and challenges based on user context and specified week
 */
exports.generateProjectIdeas = async (req, res, next) => {
  try {
    const { user, roadmap } = await getUserContext(req.user.id);
    if (!roadmap) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding and generate your roadmap first.'
      });
    }

    const requestedWeek = parseInt(req.body.week) || 1;
    const weekData = roadmap.roadmap.find(w => w.week === requestedWeek);
    
    if (!weekData) {
      return res.status(404).json({
        success: false,
        message: `Week ${requestedWeek} details not found in your active roadmap.`
      });
    }

    const result = await openaiService.generateProjectIdeas(
      weekData,
      user.onboardingData?.interest || 'General Technology',
      user.onboardingData?.level || 'Beginner',
      user.customApiKey
    );

    res.status(200).json({
      success: true,
      week: requestedWeek,
      weekGoal: weekData.goal,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

