const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, dashboardController.getDashboardStats);

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
router.get('/activities', protect, dashboardController.getRecentActivities);

// @desc    Get combined dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, dashboardController.getCombinedDashboard);

module.exports = router; 