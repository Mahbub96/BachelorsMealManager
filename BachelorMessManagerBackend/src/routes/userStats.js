const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth-simple');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @route   GET /api/user-stats/dashboard
 * @desc    Get comprehensive user dashboard statistics
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Fetch user's meal statistics
    const mealStats = await Meal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          lastMealDate: { $max: '$date' },
        },
      },
    ]);

    // Fetch user's bazar statistics
    const bazarStats = await Bazar.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalEntries: { $sum: 1 },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0],
            },
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    // Get user profile for payment info
    const user = await User.findById(userId).select(
      'monthlyContribution lastPaymentDate paymentStatus totalPaid'
    );

    // Calculate statistics
    const mealData = mealStats[0] || {
      totalMeals: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      lastMealDate: null,
    };

    const bazarData = bazarStats[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    };

    // Calculate days since last meal
    const daysSinceLastMeal = mealData.lastMealDate
      ? Math.floor(
          (currentDate - new Date(mealData.lastMealDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Calculate meal efficiency
    const mealEfficiency =
      mealData.totalMeals > 0
        ? Math.round((mealData.approvedCount / mealData.totalMeals) * 100)
        : 0;

    // Calculate average meals per day (last 30 days)
    const recentMeals = await Meal.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: thirtyDaysAgo },
    });
    const averageMealsPerDay = recentMeals / 30;

    // Calculate bazar average amount
    const averageAmount =
      bazarData.totalEntries > 0
        ? bazarData.totalAmount / bazarData.totalEntries
        : 0;

    // Calculate performance score
    const bazarEfficiency =
      bazarData.totalAmount > 0
        ? (bazarData.approvedAmount / bazarData.totalAmount) * 100
        : 0;
    const performanceScore = Math.round((mealEfficiency + bazarEfficiency) / 2);

    const dashboardStats = {
      meals: {
        total: mealData.totalMeals,
        approved: mealData.approvedCount,
        pending: mealData.pendingCount,
        rejected: mealData.rejectedCount,
        efficiency: mealEfficiency,
        averagePerDay: averageMealsPerDay,
        daysSinceLastMeal: daysSinceLastMeal,
      },
      bazar: {
        totalAmount: bazarData.totalAmount,
        pendingAmount: bazarData.pendingAmount,
        approvedAmount: bazarData.approvedAmount,
        totalEntries: bazarData.totalEntries,
        averageAmount: averageAmount,
      },
      payments: {
        monthlyContribution: user?.monthlyContribution || 5000,
        lastPaymentDate: user?.lastPaymentDate || null,
        paymentStatus: user?.paymentStatus || 'pending',
        totalPaid: user?.totalPaid || 0,
      },
      overview: {
        totalActivities: mealData.totalMeals + bazarData.totalEntries,
        recentActivityCount: Math.min(
          mealData.totalMeals + bazarData.totalEntries,
          10
        ),
        performanceScore: performanceScore,
      },
    };

    logger.info(`Dashboard stats fetched for user ${userId}`);

    res.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
});

/**
 * @route   GET /api/user-stats/meals
 * @desc    Get user meal statistics
 * @access  Private
 */
router.get('/meals', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const mealStats = await Meal.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          lastMealDate: { $max: '$date' },
        },
      },
    ]);

    const mealData = mealStats[0] || {
      totalMeals: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      lastMealDate: null,
    };

    const daysSinceLastMeal = mealData.lastMealDate
      ? Math.floor(
          (currentDate - new Date(mealData.lastMealDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const efficiency =
      mealData.totalMeals > 0
        ? Math.round((mealData.approvedCount / mealData.totalMeals) * 100)
        : 0;

    const recentMeals = await Meal.countDocuments({
      userId: userId,
      date: { $gte: thirtyDaysAgo },
    });
    const averagePerDay = recentMeals / 30;

    const mealStatistics = {
      total: mealData.totalMeals,
      approved: mealData.approvedCount,
      pending: mealData.pendingCount,
      rejected: mealData.rejectedCount,
      efficiency: efficiency,
      averagePerDay: averagePerDay,
      daysSinceLastMeal: daysSinceLastMeal,
    };

    res.json({
      success: true,
      data: mealStatistics,
    });
  } catch (error) {
    logger.error('Error fetching meal stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal statistics',
    });
  }
});

/**
 * @route   GET /api/user-stats/bazar
 * @desc    Get user bazar statistics
 * @access  Private
 */
router.get('/bazar', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const bazarStats = await Bazar.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalEntries: { $sum: 1 },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0],
            },
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    const bazarData = bazarStats[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    };

    const averageAmount =
      bazarData.totalEntries > 0
        ? bazarData.totalAmount / bazarData.totalEntries
        : 0;

    const bazarStatistics = {
      totalAmount: bazarData.totalAmount,
      pendingAmount: bazarData.pendingAmount,
      approvedAmount: bazarData.approvedAmount,
      totalEntries: bazarData.totalEntries,
      averageAmount: averageAmount,
    };

    res.json({
      success: true,
      data: bazarStatistics,
    });
  } catch (error) {
    logger.error('Error fetching bazar stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bazar statistics',
    });
  }
});

/**
 * @route   GET /api/user-stats/payments
 * @desc    Get user payment statistics
 * @access  Private
 */
router.get('/payments', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'monthlyContribution lastPaymentDate paymentStatus totalPaid'
    );

    const paymentStatistics = {
      monthlyContribution: user?.monthlyContribution || 5000,
      lastPaymentDate: user?.lastPaymentDate || null,
      paymentStatus: user?.paymentStatus || 'pending',
      totalPaid: user?.totalPaid || 0,
    };

    res.json({
      success: true,
      data: paymentStatistics,
    });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics',
    });
  }
});

module.exports = router;
