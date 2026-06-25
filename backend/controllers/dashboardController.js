const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');

/**
 * Fetch stats summary for the student dashboard
 * GET /dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user data (streak, points)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 2. Fetch roadmap
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    if (!roadmap) {
      return res.status(200).json({
        onboardingCompleted: false,
        message: 'Please complete onboarding to generate your roadmap.'
      });
    }

    // 3. Fetch progress
    let progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
    if (!progress) {
      progress = await Progress.create({
        userId,
        roadmapId: roadmap._id,
        completedTasks: [],
        studyLogs: [],
        savedVideos: []
      });
    }

    // 4. Calculate total tasks vs completed tasks
    let totalTasksCount = 0;
    roadmap.roadmap.forEach(week => {
      totalTasksCount += week.topics.length + week.practice.length + (week.mini_project ? 1 : 0);
    });

    const completedTasksCount = progress.completedTasks.length;
    const completionPercentage = totalTasksCount > 0 
      ? Math.round((completedTasksCount / totalTasksCount) * 100) 
      : 0;

    // 5. Calculate current active week
    let currentWeek = 1;
    const totalWeeks = roadmap.roadmap.length;
    for (let w = 1; w <= totalWeeks; w++) {
      const weekData = roadmap.roadmap.find(item => item.week === w);
      if (!weekData) continue;

      const totalItemsInWeek = weekData.topics.length + weekData.practice.length + (weekData.mini_project ? 1 : 0);
      const completedInWeek = progress.completedTasks.filter(task => task.week === w).length;

      if (completedInWeek < totalItemsInWeek) {
        currentWeek = w;
        break;
      }
      currentWeek = totalWeeks;
    }

    // 6. Calculate study hour metrics
    const totalHoursStudied = progress.studyLogs.reduce((sum, log) => sum + log.hours, 0);
    const dailyGoal = user.onboardingData?.dailyHours || 2;
    const weeklyGoal = dailyGoal * 7;

    // Remaining time (in weeks)
    const remainingWeeks = Math.max(0, totalWeeks - currentWeek + 1);

    res.status(200).json({
      success: true,
      onboardingCompleted: true,
      stats: {
        completionPercentage,
        currentWeek,
        totalWeeks,
        totalHoursStudied: parseFloat(totalHoursStudied.toFixed(1)),
        weeklyGoal,
        streak: user.streak,
        remainingWeeks,
        points: user.points,
        totalTasks: totalTasksCount,
        completedTasksCount
      },
      completedTasks: progress.completedTasks,
      studyLogs: progress.studyLogs,
      roadmapSummary: roadmap.summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch leaderboard ranking list
 * GET /dashboard/leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    // Get top 10 users by points
    const topUsers = await User.find({})
      .select('name points streak onboardingData.interest')
      .sort({ points: -1 })
      .limit(10);

    const leaderboard = topUsers.map((user, idx) => ({
      rank: idx + 1,
      name: user.name,
      points: user.points,
      streak: user.streak,
      interest: user.onboardingData?.interest || 'General Development'
    }));

    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};
