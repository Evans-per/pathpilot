const rateLimit = require('express-rate-limit');

// General API Rate Limiting (Applies broadly to all API endpoints)
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication Limiting (Tight limits on signup, login, password recovery)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 authentication actions per hour
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please retry after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI Generation Limiting (Throttles heavy LLM call actions)
exports.aiGenerationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each IP to 10 roadmap generations per day
  message: {
    success: false,
    message: 'Daily AI roadmap limit reached. You can generate up to 10 roadmaps per day.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
