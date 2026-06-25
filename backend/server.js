require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express App
const app = express();

// Connect to Database
connectDB();

// Global Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // In production, replace with actual frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Apply global rate limiting to all requests
app.use('/api', apiLimiter);

// Import Routers
const authRouter = require('./routes/auth');
const roadmapRouter = require('./routes/roadmap');
const plannerRouter = require('./routes/planner');
const dashboardRouter = require('./routes/dashboard');
const videoRouter = require('./routes/video');
const chatRouter = require('./routes/chat');
const aiRouter = require('./routes/ai');

// Mount routes to match user requested API endpoints
app.use('/auth', authRouter); // maps /auth/signup, /auth/login, /auth/onboarding, etc.
app.use('/', roadmapRouter); // maps POST /generate-roadmap and GET /roadmap
app.use('/', plannerRouter); // maps POST /planner and POST /complete-task and POST /log-hours
app.use('/dashboard', dashboardRouter); // maps GET /dashboard and GET /dashboard/leaderboard
app.use('/videos', videoRouter); // maps GET /videos, GET /videos/saved, POST /videos/save, etc.
app.use('/chat', chatRouter);     // maps POST /chat
app.use('/ai', aiRouter);         // maps /ai/quiz, /ai/notes, /ai/flashcards, /ai/daily-plan, /ai/analytics

// Fallback for unmatched endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint ${req.method} ${req.url} not found.` });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PathPilot Server running in development mode on port ${PORT}`);
});
