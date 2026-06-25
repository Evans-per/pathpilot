const openaiService = require('../services/openaiService');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const User = require('../models/User');

/**
 * Handle AI Learning assistant chat request
 * POST /chat
 */
exports.handleChatMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const userId = req.user.id;

    // 1. Fetch user context
    const user = await User.findById(userId).select('-password');
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    
    let progress = null;
    let currentWeek = 1;

    if (roadmap) {
      progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
      
      // Calculate current week
      const totalWeeks = roadmap.roadmap.length;
      for (let w = 1; w <= totalWeeks; w++) {
        const weekData = roadmap.roadmap.find(item => item.week === w);
        if (!weekData) continue;

        const totalItemsInWeek = weekData.topics.length + weekData.practice.length + (weekData.mini_project ? 1 : 0);
        const completedInWeek = progress ? progress.completedTasks.filter(task => task.week === w).length : 0;

        if (completedInWeek < totalItemsInWeek) {
          currentWeek = w;
          break;
        }
        currentWeek = totalWeeks;
      }
    }

    const context = {
      roadmap,
      completedTasks: progress ? progress.completedTasks : [],
      currentWeek,
      userProfile: user
    };

    // 2. Call AI service
    const reply = await openaiService.getChatCompletion(message, history || [], context);

    res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    next(error);
  }
};
