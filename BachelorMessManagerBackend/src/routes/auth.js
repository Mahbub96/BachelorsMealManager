const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const {
  validateRegistration,
  validateLogin,
} = require('../middleware/validation');
const authController = require('../controllers/authController');

// Stricter rate limit for auth endpoints — prevent brute force and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many attempts. Try again later.', errorCode: 'RATE_LIMIT_ERROR' },
  standardHeaders: true,
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'unknown',
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, validateRegistration, authController.register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, validateLogin, authController.login);

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, authController.getProfile);

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, authController.updateProfile);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, authController.changePassword);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', authLimiter, authController.refreshToken);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, authController.logout);

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', protect, authController.verifyToken);

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
