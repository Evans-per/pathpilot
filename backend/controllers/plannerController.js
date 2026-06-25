const Progress = require('../models/Progress');
const User = require('../models/User');
const plannerService = require('../services/plannerService');

/**
 * Generate daily study planner based on slots
 * POST /planner
 */
exports.getDailyPlan = async (req, res, next) => {
  try {
    const { slot1, slot2 } = req.body;
    if (!slot1 || !slot2) {
      return res.status(400).json({ message: 'Please select both study slots.' });
    }

    const plan = await plannerService.generateDailyPlan(req.user.id, slot1, slot2);
    res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a task (topic, practice, or project) as completed or incomplete
 * POST /complete-task
 */
exports.toggleTaskCompletion = async (req, res, next) => {
  try {
    const { week, taskType, taskName, studyHours } = req.body;

    if (!week || !taskType || !taskName) {
      return res.status(400).json({ message: 'Missing completion details: week, taskType, or taskName.' });
    }

    // Find progress
    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'Learning progress record not found. Please onboard first.' });
    }

    // Check if task is already completed
    const existingIndex = progress.completedTasks.findIndex(
      t => t.week === parseInt(week, 10) && t.taskType === taskType && t.taskName.toLowerCase() === taskName.toLowerCase()
    );

    let isCompletedNow = false;
    let pointReward = 0;

    const user = await User.findById(req.user.id);

    if (existingIndex > -1) {
      // Uncheck task: Remove from completions
      progress.completedTasks.splice(existingIndex, 1);
      
      // Deduct points
      if (taskType === 'topic') pointReward = -10;
      else if (taskType === 'practice') pointReward = -20;
      else if (taskType === 'mini_project') pointReward = -50;
      
      if (user) {
        user.points = Math.max(0, user.points + pointReward);
        await user.save();
      }
    } else {
      // Check task: Add to completions
      progress.completedTasks.push({
        week: parseInt(week, 10),
        taskType,
        taskName
      });
      isCompletedNow = true;

      // Add points
      if (taskType === 'topic') pointReward = 10;
      else if (taskType === 'practice') pointReward = 20;
      else if (taskType === 'mini_project') pointReward = 50;

      if (user) {
        user.points += pointReward;
        await user.save();
      }

      // Log study hours if provided
      if (studyHours && parseFloat(studyHours) > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const logIndex = progress.studyLogs.findIndex(log => log.date === todayStr);

        if (logIndex > -1) {
          progress.studyLogs[logIndex].hours += parseFloat(studyHours);
        } else {
          progress.studyLogs.push({
            date: todayStr,
            hours: parseFloat(studyHours)
          });
        }
      }
    }

    await progress.save();

    res.status(200).json({
      success: true,
      completed: isCompletedNow,
      pointsReward: pointReward,
      currentPoints: user ? user.points : 0,
      completedTasks: progress.completedTasks,
      studyLogs: progress.studyLogs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log custom study hours manually
 * POST /log-hours
 */
exports.logStudyHours = async (req, res, next) => {
  try {
    const { hours } = req.body;
    if (hours === undefined || parseFloat(hours) <= 0) {
      return res.status(400).json({ message: 'Please provide valid study hours greater than 0.' });
    }

    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'Learning progress record not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const logIndex = progress.studyLogs.findIndex(log => log.date === todayStr);

    if (logIndex > -1) {
      progress.studyLogs[logIndex].hours += parseFloat(hours);
    } else {
      progress.studyLogs.push({
        date: todayStr,
        hours: parseFloat(hours)
      });
    }

    await progress.save();

    res.status(200).json({
      success: true,
      studyLogs: progress.studyLogs
    });
  } catch (error) {
    next(error);
  }
};
