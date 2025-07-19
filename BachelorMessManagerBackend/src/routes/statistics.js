const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const StatisticsService = require('../services/statisticsService');
const logger = require('../utils/logger');

// Get complete statistics
router.get('/complete', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate, timeframe, type } = req.query;
    const filters = {
      forceUpdate: forceUpdate === 'true',
      timeframe,
      type,
    };

    const stats = await StatisticsService.getStatistics(filters.forceUpdate);

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching complete statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get global statistics
router.get('/global', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getStatistics(forceUpdate === 'true');

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch global statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data.global,
    });
  } catch (error) {
    logger.error('Error fetching global statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get meal statistics
router.get('/meals', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getMealStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch meal statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching meal statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get bazar statistics
router.get('/bazar', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getBazarStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch bazar statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching bazar statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get user statistics
router.get('/users', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getUserStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch user statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get activity statistics
router.get('/activity', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getActivityStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch activity statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching activity statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get monthly statistics
router.get('/monthly', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getStatistics(forceUpdate === 'true');

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch monthly statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data.monthly,
    });
  } catch (error) {
    logger.error('Error fetching monthly statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Refresh statistics (admin only)
router.post('/refresh', AuthMiddleware.protect(), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
      });
    }

    // Force update all statistics
    await StatisticsService.updateAfterOperation('manual_refresh', {
      adminId: req.user.id,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Statistics refreshed successfully',
    });
  } catch (error) {
    logger.error('Error refreshing statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get dashboard statistics (combined)
router.get('/dashboard', AuthMiddleware.protect(), async (req, res) => {
  try {
    const { forceUpdate } = req.query;
    const stats = await StatisticsService.getDashboardStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error || 'Failed to fetch dashboard statistics',
      });
    }

    res.json({
      success: true,
      data: stats.data,
    });
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
