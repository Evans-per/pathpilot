const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const authMiddleware = require('../middleware/auth');
const { aiGenerationLimiter } = require('../middleware/rateLimiter');

router.post('/generate-roadmap', authMiddleware, aiGenerationLimiter, roadmapController.generateUserRoadmap);
router.get('/roadmap', authMiddleware, roadmapController.getUserRoadmap);

module.exports = router;
