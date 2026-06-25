const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, dashboardController.getDashboardStats);
router.get('/leaderboard', authMiddleware, dashboardController.getLeaderboard);

module.exports = router;
