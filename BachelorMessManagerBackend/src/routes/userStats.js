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
    // Use same user ID extraction as mealController for consistency
    let userId = req.user._id || req.user.id;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }
    const currentDate = new Date();

    // Calculate current month date range: from 1st of current month to current date
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const todayEndOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59,
      999,
    );

    // Fetch user's meal statistics

    // Use Meal.getStats method directly for consistency with /api/meals/user/stats endpoint
    // This ensures we get the correct totalMeals count (sum of individual meals)
    // Filter by current month: from 1st of month to current date
    const statsFromModel = await Meal.getStats({
      userId: userId,
      startDate: firstDayOfMonth,
      endDate: todayEndOfDay,
    });

    // Also run aggregation for lastMealDate (not in getStats) - current month only
    const lastMealAggregation = await Meal.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: firstDayOfMonth, $lte: todayEndOfDay },
        },
      },
      {
        $group: {
          _id: null,
          lastMealDate: { $max: '$date' },
        },
      },
    ]);

    const lastMealDate = lastMealAggregation[0]?.lastMealDate || null;

    // Use stats from Meal.getStats for consistency
    const mealStats = [{
      totalMeals: statsFromModel.totalMeals,
      totalEntries: statsFromModel.totalEntries,
      approvedCount: statsFromModel.approvedCount,
      pendingCount: statsFromModel.pendingCount,
      rejectedCount: statsFromModel.rejectedCount,
      lastMealDate: lastMealDate,
    }];

    // Fetch user's bazar statistics - current month only
    // Use Bazar.getStats method for consistency, or use aggregation with date filter
    const bazarStats = await Bazar.aggregate([
      {
        $match: {
          userId: userId, // userId is already ObjectId
          date: { $gte: firstDayOfMonth, $lte: todayEndOfDay },
        },
      },
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

    // Note: User profile query removed as we're no longer using payment data

    // Calculate statistics - use statsFromModel directly for accuracy
    const mealData = {
      totalMeals: statsFromModel.totalMeals,
      totalEntries: statsFromModel.totalEntries,
      approvedCount: statsFromModel.approvedCount,
      pendingCount: statsFromModel.pendingCount,
      rejectedCount: statsFromModel.rejectedCount,
      lastMealDate: lastMealDate,
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

    // Calculate meal efficiency (based on entries, not individual meals)
    const mealEfficiency =
      mealData.totalEntries > 0
        ? Math.round((mealData.approvedCount / mealData.totalEntries) * 100)
        : 0;

    // Calculate average meals per day (current month) - count entries, not individual meals
    const currentDayOfMonth = currentDate.getDate(); // 1-31
    const averageMealsPerDay = currentDayOfMonth > 0
      ? mealData.totalMeals / currentDayOfMonth
      : 0;

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


    // CRITICAL: Verify the totalMeals value before sending response
    // Ensure we use statsFromModel directly - this is the same method used by /api/meals/user/stats
    const finalTotalMeals = statsFromModel.totalMeals || 0;


    // Calculate current meal rate: totalMeals / totalBazarAmount (for current month)
    const currentMealRate =
      finalTotalMeals > 0
        ? bazarData.totalAmount / finalTotalMeals
        : 0;

    console.log('statsFromModel:158', currentMealRate, statsFromModel, bazarData.totalAmount);
    const dashboardStats = {
      meals: {
        total: finalTotalMeals, // Use directly from Meal.getStats to ensure accuracy - same as /api/meals/user/stats
        approved: statsFromModel.approvedCount || 0,
        pending: statsFromModel.pendingCount || 0,
        rejected: statsFromModel.rejectedCount || 0,
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
      currentMealRate: {
        rate: currentMealRate,
        totalMeals: finalTotalMeals,
        totalBazarAmount: bazarData.totalAmount,
      },
      overview: {
        totalActivities: finalTotalMeals + bazarData.totalEntries, // Use finalTotalMeals for consistency
        recentActivityCount: Math.min(
          finalTotalMeals + bazarData.totalEntries,
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
    // Use same user ID extraction as mealController for consistency
    let userId = req.user._id || req.user.id;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Calculate individual meals (breakfast + lunch + dinner), not just entries
    const mealStats = await Meal.aggregate([
      { $match: { userId: userId } }, // userId is already ObjectId
      {
        $addFields: {
          mealsPerEntry: {
            $add: [
              { $cond: ['$breakfast', 1, 0] },
              { $cond: ['$lunch', 1, 0] },
              { $cond: ['$dinner', 1, 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: '$mealsPerEntry' }, // Sum of individual meals
          totalEntries: { $sum: 1 }, // Count of meal entry documents
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
      totalEntries: 0,
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

    // Calculate efficiency based on entries, not individual meals
    const efficiency =
      mealData.totalEntries > 0
        ? Math.round((mealData.approvedCount / mealData.totalEntries) * 100)
        : 0;

    const recentMeals = await Meal.countDocuments({
      userId: userId, // userId is already ObjectId
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
    // Use same user ID extraction as mealController for consistency
    let userId = req.user._id || req.user.id;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }

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
    // Use same user ID extraction as mealController for consistency
    let userId = req.user._id || req.user.id;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }

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
