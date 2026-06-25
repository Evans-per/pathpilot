const youtubeService = require('../services/youtubeService');
const Progress = require('../models/Progress');

/**
 * Fetch and rank videos for a specific topic
 * GET /videos
 */
exports.getTopicVideos = async (req, res, next) => {
  try {
    const { topic } = req.query;
    if (!topic) {
      return res.status(400).json({ message: 'Topic parameter is required.' });
    }

    const videos = await youtubeService.getVideosForTopic(
      topic,
      req.user?.onboardingData?.level || 'Beginner',
      req.user?.onboardingData?.interest || ''
    );
    res.status(200).json({
      success: true,
      topic,
      videos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save video to user bookmarks
 * POST /videos/save
 */
exports.saveVideo = async (req, res, next) => {
  try {
    const { videoId, title, thumbnail, channel } = req.body;
    if (!videoId || !title || !thumbnail || !channel) {
      return res.status(400).json({ message: 'Missing video details: videoId, title, thumbnail, or channel.' });
    }

    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'Progress details not found.' });
    }

    // Check if already saved
    const isSaved = progress.savedVideos.some(v => v.videoId === videoId);
    if (isSaved) {
      return res.status(400).json({ message: 'Video is already bookmarked.' });
    }

    progress.savedVideos.push({ videoId, title, thumbnail, channel });
    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Video bookmarked successfully!',
      savedVideos: progress.savedVideos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove video from user bookmarks
 * DELETE /videos/save/:videoId
 */
exports.removeSavedVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'Progress details not found.' });
    }

    progress.savedVideos = progress.savedVideos.filter(v => v.videoId !== videoId);
    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Video removed from bookmarks.',
      savedVideos: progress.savedVideos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all saved videos
 * GET /videos/saved
 */
exports.getSavedVideos = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(200).json({ success: true, savedVideos: [] });
    }

    res.status(200).json({
      success: true,
      savedVideos: progress.savedVideos
    });
  } catch (error) {
    next(error);
  }
};
