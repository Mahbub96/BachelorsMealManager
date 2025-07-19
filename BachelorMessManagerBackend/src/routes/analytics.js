const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private
router.get('/', protect, analyticsController.getAnalytics);

// @desc    Get user analytics
// @route   GET /api/analytics/user/:userId
// @access  Private/Admin
router.get('/user/:userId', protect, authorize('admin'), analyticsController.getUserAnalytics);

// @desc    Get system analytics (admin only)
// @route   GET /api/analytics/system
// @access  Private/Admin
router.get('/system', protect, authorize('admin'), analyticsController.getSystemAnalytics);

module.exports = router; 