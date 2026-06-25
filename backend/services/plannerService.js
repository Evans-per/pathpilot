const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const User = require('../models/User');
const youtubeService = require('./youtubeService');

/**
 * Generate a study plan for today
 * based on user slots, current week, and active roadmap.
 */
exports.generateDailyPlan = async (userId, slot1, slot2) => {
  // 1. Fetch active roadmap
  const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
  if (!roadmap) {
    throw new Error('No learning roadmap found. Please onboard first.');
  }

  // 2. Fetch progress
  let progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
  if (!progress) {
    // Initialize progress if it doesn't exist
    progress = await Progress.create({
      userId,
      roadmapId: roadmap._id,
      completedTasks: [],
      studyLogs: [],
      savedVideos: []
    });
  }

  // 3. Determine the current week
  // We can calculate current week based on date or by checking completions.
  // Let's check which weeks are completed. A week is completed if all topics/tasks are marked completed.
  // For simplicity, let's find the first week that is not fully completed.
  let currentWeekNum = 1;
  const totalWeeks = roadmap.roadmap.length;

  for (let w = 1; w <= totalWeeks; w++) {
    const weekData = roadmap.roadmap.find(item => item.week === w);
    if (!weekData) continue;

    const totalTopicsAndPractice = weekData.topics.length + weekData.practice.length + (weekData.mini_project ? 1 : 0);
    const completedForThisWeek = progress.completedTasks.filter(task => task.week === w).length;

    if (completedForThisWeek < totalTopicsAndPractice) {
      currentWeekNum = w;
      break;
    }
    // If all weeks are completed, default to the last week
    currentWeekNum = totalWeeks;
  }

  const currentWeekData = roadmap.roadmap.find(w => w.week === currentWeekNum);
  if (!currentWeekData) {
    throw new Error(`Active week ${currentWeekNum} data not found in roadmap.`);
  }

  // Get completed items for active week
  const completedNames = progress.completedTasks
    .filter(t => t.week === currentWeekNum)
    .map(t => t.taskName.toLowerCase());

  // 4. Identify remaining topics and practice exercises
  const remainingTopics = currentWeekData.topics.filter(t => !completedNames.includes(t.toLowerCase()));
  const remainingPractice = currentWeekData.practice.filter(p => !completedNames.includes(p.toLowerCase()));
  
  const projectCompleted = completedNames.includes(currentWeekData.mini_project?.toLowerCase());
  const remainingProject = (!projectCompleted && currentWeekData.mini_project) ? currentWeekData.mini_project : null;

  // 5. Build Slot assignments
  const user = await User.findById(userId);
  const level = user?.onboardingData?.level || 'Beginner';
  const interest = user?.onboardingData?.interest || '';

  // Slot 1
  const slot1Plan = await buildSlotPlan(slot1, currentWeekNum, remainingTopics, remainingPractice, remainingProject, level, interest);
  
  // Slot 2
  // We remove the topic/practice assigned to Slot 1 to avoid duplication
  const slot2Topics = remainingTopics.filter(t => t !== slot1Plan.topic);
  const slot2Practice = remainingPractice.filter(p => p !== slot1Plan.practiceTask);
  const slot2Project = slot1Plan.isProject ? null : remainingProject;
  
  const slot2Plan = await buildSlotPlan(slot2, currentWeekNum, slot2Topics, slot2Practice, slot2Project, level, interest);

  return {
    week: currentWeekNum,
    goal: currentWeekData.goal,
    estimated_hours: currentWeekData.estimated_hours,
    slots: {
      slot1: slot1Plan,
      slot2: slot2Plan
    }
  };
};

/**
 * Assign content to a given study slot
 */
async function buildSlotPlan(slotName, weekNum, topics, practiceExercises, projectDescription, level = 'Beginner', interest = '') {
  const plan = {
    slot: slotName,
    topic: null,
    practiceTask: null,
    videos: [],
    isProject: false,
    empty: false
  };

  // Heuristic: If we have remaining topics, study topic.
  // If no topics left but practice exercises remain, do practice exercise.
  // If only project remains, do project.
  // If nothing remains, slot is complete!
  if (topics.length > 0) {
    plan.topic = topics[0];
    // Suggest the first practice task as well
    if (practiceExercises.length > 0) {
      plan.practiceTask = practiceExercises[0];
    }
    
    // Fetch recommended videos for this topic
    try {
      const videos = await youtubeService.getVideosForTopic(plan.topic, level, interest);
      plan.videos = videos.slice(0, 2); // Return top 2 recommendations
    } catch (err) {
      console.error(`Error loading videos for slot plan topic: ${plan.topic}`, err.message);
    }
  } else if (practiceExercises.length > 0) {
    plan.topic = 'Practical Implementation & Exercises';
    plan.practiceTask = practiceExercises[0];
  } else if (projectDescription) {
    plan.topic = 'Weekly Mini-Project Implementation';
    plan.practiceTask = projectDescription;
    plan.isProject = true;
  } else {
    plan.topic = 'Catch up & Revision';
    plan.practiceTask = 'Review notes or practice building custom applications.';
    plan.empty = true;
  }

  return plan;
}
