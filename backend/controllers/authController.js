const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_jwt_secret_key_123456', {
    expiresIn: '30d'
  });
};

/**
 * Register a new user
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Sign token & create Session
    const token = signToken(user._id);
    await Session.create({
      userId: user._id,
      token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        points: user.points,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login existing user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Update streak (simple logic: check if last active was yesterday, increase; if today, keep; if older, reset)
    const todayStr = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate) {
      const lastActiveStr = user.lastActiveDate.toISOString().split('T')[0];
      const diffDays = Math.ceil((new Date(todayStr) - new Date(lastActiveStr)) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
        user.points += 5; // 5 points per consecutive day
      } else if (diffDays > 1) {
        user.streak = 1; // Reset streak
      }
    } else {
      user.streak = 1;
    }
    user.lastActiveDate = new Date();
    await user.save();

    // Sign token & log Session
    const token = signToken(user._id);
    await Session.create({
      userId: user._id,
      token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        onboardingData: user.onboardingData,
        points: user.points,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user (revoke active session)
 */
exports.logout = async (req, res, next) => {
  try {
    await Session.findOneAndDelete({ token: req.token });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit onboarding details
 */
exports.submitOnboarding = async (req, res, next) => {
  try {
    const { interest, level, deadlineValue, deadlineUnit, dailyHours, learningStyle, existingSkills } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.onboardingData = {
      interest,
      level,
      deadlineValue: parseInt(deadlineValue, 10),
      deadlineUnit,
      dailyHours: parseFloat(dailyHours),
      learningStyle,
      existingSkills: Array.isArray(existingSkills) ? existingSkills : existingSkills.split(',').map(s => s.trim()).filter(Boolean)
    };

    // Reward initial points
    user.points += 50; 
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        onboardingData: user.onboardingData,
        points: user.points,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - returns token (mock response prints token to log/res for easy developer flow)
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user registered with that email address.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    console.log(`Password reset token generated for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Password reset token generated. Check terminal logs or use this token to reset.',
      resetToken // Returned directly so users can immediately test without SMTP configuration!
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Revoke all existing sessions for this user as a security measure
    await Session.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile information
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user profile, roadmap and progress records
 */
exports.resetProfile = async (req, res, next) => {
  try {
    const Roadmap = require('../models/Roadmap');
    const Progress = require('../models/Progress');

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Reset onboarding flag and metrics
    user.onboardingCompleted = false;
    user.onboardingData = undefined;
    user.points = 0;
    user.streak = 0;
    user.lastActiveDate = undefined;
    await user.save();

    // Delete associated roadmap and progress
    await Roadmap.deleteMany({ userId: user._id });
    await Progress.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Profile and learning records reset successfully!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update custom OpenAI API Key
 */
exports.updateApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.customApiKey = apiKey;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'API Key updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        onboardingData: user.onboardingData,
        points: user.points,
        streak: user.streak,
        customApiKey: user.customApiKey
      }
    });
  } catch (error) {
    next(error);
  }
};
