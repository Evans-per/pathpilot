const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication failed. Token missing.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_key_123456');

    // 3. Verify token exists in active sessions (for logout/revocation checks)
    const session = await Session.findOne({ token, userId: decoded.id });
    if (!session) {
      return res.status(401).json({ message: 'Session expired or logged out. Please log in again.' });
    }

    // 4. Fetch associated user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Update streak on new day activity (avoid writing to DB on every request of the same day)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (user.lastActiveDate) {
      const lastActiveStr = user.lastActiveDate.toISOString().split('T')[0];
      
      if (todayStr !== lastActiveStr) {
        const todayDate = new Date(todayStr);
        const lastActiveDate = new Date(lastActiveStr);
        const diffTime = todayDate - lastActiveDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          user.streak += 1;
          user.points += 5; // Reward points for consecutive daily study
        } else if (diffDays > 1) {
          user.streak = 1; // Reset streak if they missed a day
        }
        user.lastActiveDate = today;
        await user.save();
      }
    } else {
      user.streak = 1;
      user.lastActiveDate = today;
      await user.save();
    }

    // 5. Attach token & user to requests
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication failed. Token expired.' });
    }
    return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
};
