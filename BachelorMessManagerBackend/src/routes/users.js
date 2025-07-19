const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const userController = require('../controllers/userController');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, userController.getUserProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, userController.updateUserProfile);

// @desc    Get user statistics
// @route   GET /api/users/stats/:userId
// @access  Private
router.get('/stats/:userId', protect, userController.getUserStats);

// @desc    Get current user statistics
// @route   GET /api/users/stats/current
// @access  Private
router.get('/stats/current', protect, userController.getCurrentUserStats);

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, userController.getUserDashboard);

module.exports = router;
