const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.post('/quiz',        authMiddleware, aiController.generateQuiz);
router.post('/notes',       authMiddleware, aiController.generateNotes);
router.post('/flashcards',  authMiddleware, aiController.generateFlashcards);
router.get('/daily-plan',   authMiddleware, aiController.getDailyPlan);
router.get('/analytics',    authMiddleware, aiController.getAnalytics);
router.post('/project-ideas', authMiddleware, aiController.generateProjectIdeas);

module.exports = router;
