const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/auth');

router.post('/planner', authMiddleware, plannerController.getDailyPlan);
router.post('/complete-task', authMiddleware, plannerController.toggleTaskCompletion);
router.post('/log-hours', authMiddleware, plannerController.logStudyHours);

module.exports = router;
