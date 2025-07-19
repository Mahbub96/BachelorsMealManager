const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const activityController = require('../controllers/activityController');

/**
 * @route   GET /api/activity/recent
 * @desc    Get recent activities with advanced filtering
 * @access  Private
 */
router.get(
  '/recent',
  AuthMiddleware.protect(),
  activityController.getRecentActivities
);

/**
 * @route   GET /api/activity/meals/current-month
 * @desc    Get current month meals with statistics
 * @access  Private
 */
router.get(
  '/meals/current-month',
  AuthMiddleware.protect(),
  activityController.getCurrentMonthMeals
);

/**
 * @route   GET /api/activity/stats
 * @desc    Get activity statistics
 * @access  Private
 */
router.get(
  '/stats',
  AuthMiddleware.protect(),
  activityController.getActivityStats
);

module.exports = router;
