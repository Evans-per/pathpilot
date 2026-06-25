const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, videoController.getTopicVideos);
router.get('/saved', authMiddleware, videoController.getSavedVideos);
router.get('/:topic', authMiddleware, (req, res, next) => {
  req.query.topic = req.params.topic;
  videoController.getTopicVideos(req, res, next);
});
router.post('/save', authMiddleware, videoController.saveVideo);
router.delete('/save/:videoId', authMiddleware, videoController.removeSavedVideo);

module.exports = router;
