const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate limited endpoints
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Auth protected endpoints
router.post('/onboarding', authMiddleware, authController.submitOnboarding);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/logout', authMiddleware, authController.logout);
router.post('/reset', authMiddleware, authController.resetProfile);
router.post('/api-key', authMiddleware, authController.updateApiKey);

module.exports = router;
