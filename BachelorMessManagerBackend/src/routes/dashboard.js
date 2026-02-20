const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const dashboardController = require('../controllers/dashboardController');
const analyticsController = require('../controllers/analyticsController');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, dashboardController.getDashboardStats);

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
router.get('/activities', protect, dashboardController.getRecentActivities);

// @desc    Get analytics data (same as GET /api/analytics, for client compatibility)
// @route   GET /api/dashboard/analytics
// @access  Private
router.get('/analytics', protect, (req, res, next) =>
  analyticsController.getAnalytics(req, res, next)
);

// @desc    Get combined dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, dashboardController.getCombinedDashboard);

module.exports = router;
