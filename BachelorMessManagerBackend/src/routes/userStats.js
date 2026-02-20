const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth-simple');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const User = require('../models/User');
const logger = require('../utils/logger');
const { getGroupMemberIds } = require('../utils/groupHelper');
const {
  getCurrentMonthRange,
  aggregateStatsAmounts,
  aggregateSumInDateRange,
} = require('../utils/bazarHelper');

/**
 * @route   GET /api/user-stats/dashboard
 * @desc    Get comprehensive user dashboard statistics (group-scoped for admin/member)
 * @access  Private
 * - For admin/member: total meals and total bazar are GROUP totals (current month).
 * - Meal rate = group total bazar / group total meals.
 * - bazar.myTotalAmount = current user's bazar (current month) for bazar tab.
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    let userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User context missing',
      });
    }
    if (typeof userId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user context',
        });
      }
      userId = new mongoose.Types.ObjectId(userId);
    }
    const currentDate = new Date();
    const monthRange = getCurrentMonthRange();
    const firstDayOfMonth = monthRange.firstDay;
    const todayEndOfDay = monthRange.lastDay;

    let groupMemberIds = null;
    try {
      groupMemberIds = await getGroupMemberIds(req.user);
    } catch (groupErr) {
      logger.warn('getGroupMemberIds failed, using single-user scope', {
        error: groupErr?.message,
        userId: userId?.toString(),
      });
    }
    const useGroup =
      Array.isArray(groupMemberIds) &&
      groupMemberIds.length > 0;

    let finalTotalMeals = 0;
    let mealData = {
      totalMeals: 0,
      totalEntries: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      lastMealDate: null,
    };
    let bazarData = {
      totalAmount: 0,
      totalEntries: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    };
    let myBazarTotal = 0;

    if (useGroup) {
      // All-time group totals for dashboard cards (so cards show real activity)
      const mealMatchAll = { userId: { $in: groupMemberIds } };
      const mealAggAll = await Meal.aggregate([
        { $match: mealMatchAll },
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
            totalMeals: { $sum: '$mealsPerEntry' },
            totalEntries: { $sum: 1 },
            approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            lastMealDate: { $max: '$date' },
          },
        },
      ]);
      const groupMealAll = mealAggAll[0] || {};
      finalTotalMeals = groupMealAll.totalMeals || 0;
      mealData = {
        totalMeals: finalTotalMeals,
        totalEntries: groupMealAll.totalEntries || 0,
        approvedCount: groupMealAll.approvedCount || 0,
        pendingCount: groupMealAll.pendingCount || 0,
        rejectedCount: groupMealAll.rejectedCount || 0,
        lastMealDate: groupMealAll.lastMealDate || null,
      };

      bazarData = await aggregateStatsAmounts(Bazar, {
        userId: { $in: groupMemberIds },
      });

      // Current month only for meal rate and "my bazar" (bazar tab)
      const groupBazarThisMonth = await aggregateSumInDateRange(
        Bazar,
        { userId: { $in: groupMemberIds } },
        monthRange
      );
      const mealMatchMonth = {
        userId: { $in: groupMemberIds },
        date: { $gte: firstDayOfMonth, $lte: todayEndOfDay },
      };
      const mealAggMonth = await Meal.aggregate([
        { $match: mealMatchMonth },
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
        { $group: { _id: null, totalMeals: { $sum: '$mealsPerEntry' } } },
      ]);
      const groupMealsThisMonth = mealAggMonth[0]?.totalMeals || 0;

      myBazarTotal = await aggregateSumInDateRange(
        Bazar,
        { userId },
        monthRange
      );

      // Meal rate = current month only (group bazar / group meals this month)
      bazarData._mealRateBazar = groupBazarThisMonth;
      mealData._mealRateMeals = groupMealsThisMonth;
    } else {
      // Non-group (e.g. super_admin or no group): use all-time totals for cards so data appears
      const mealAggAll = await Meal.aggregate([
        { $match: { userId } },
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
            totalMeals: { $sum: '$mealsPerEntry' },
            totalEntries: { $sum: 1 },
            approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            lastMealDate: { $max: '$date' },
          },
        },
      ]);
      const singleMealAll = mealAggAll[0] || {};
      finalTotalMeals = singleMealAll.totalMeals || 0;
      mealData = {
        totalMeals: finalTotalMeals,
        totalEntries: singleMealAll.totalEntries || 0,
        approvedCount: singleMealAll.approvedCount || 0,
        pendingCount: singleMealAll.pendingCount || 0,
        rejectedCount: singleMealAll.rejectedCount || 0,
        lastMealDate: singleMealAll.lastMealDate || null,
      };

      bazarData = await aggregateStatsAmounts(Bazar, { userId });
      myBazarTotal = bazarData.totalAmount || 0;

      // Meal rate: current month only (same as group path)
      const bazarAggMonthResult = await aggregateSumInDateRange(
        Bazar,
        { userId },
        monthRange
      );
      const mealAggMonth = await Meal.aggregate([
        { $match: { userId, date: { $gte: firstDayOfMonth, $lte: todayEndOfDay } } },
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
        { $group: { _id: null, totalMeals: { $sum: '$mealsPerEntry' } } },
      ]);
      mealData._mealRateMeals = mealAggMonth[0]?.totalMeals ?? 0;
      bazarData._mealRateBazar = bazarAggMonthResult;
    }

    const daysSinceLastMeal = mealData.lastMealDate
      ? Math.floor(
        (currentDate - new Date(mealData.lastMealDate)) / (1000 * 60 * 60 * 24)
      )
      : 0;
    const mealEfficiency =
      mealData.totalEntries > 0
        ? Math.round((mealData.approvedCount / mealData.totalEntries) * 100)
        : 0;
    const currentDayOfMonth = currentDate.getDate();
    const averageMealsPerDay =
      currentDayOfMonth > 0 ? mealData.totalMeals / currentDayOfMonth : 0;
    const averageAmount =
      bazarData.totalEntries > 0 ? bazarData.totalAmount / bazarData.totalEntries : 0;
    const bazarEfficiency =
      bazarData.totalAmount > 0
        ? (bazarData.approvedAmount / bazarData.totalAmount) * 100
        : 0;
    const performanceScore = Math.round((mealEfficiency + bazarEfficiency) / 2);

    const mealRateBazar = bazarData._mealRateBazar !== undefined ? bazarData._mealRateBazar : bazarData.totalAmount;
    const mealRateMeals = mealData._mealRateMeals !== undefined ? mealData._mealRateMeals : finalTotalMeals;
    const currentMealRate =
      mealRateMeals > 0 ? mealRateBazar / mealRateMeals : 0;
    delete bazarData._mealRateBazar;
    delete mealData._mealRateMeals;

    const dashboardStats = {
      meals: {
        total: finalTotalMeals,
        approved: mealData.approvedCount || 0,
        pending: mealData.pendingCount || 0,
        rejected: mealData.rejectedCount || 0,
        efficiency: mealEfficiency,
        averagePerDay: averageMealsPerDay,
        daysSinceLastMeal,
      },
      bazar: {
        totalAmount: bazarData.totalAmount,
        pendingAmount: bazarData.pendingAmount || 0,
        approvedAmount: bazarData.approvedAmount || 0,
        totalEntries: bazarData.totalEntries || 0,
        averageAmount: averageAmount,
        myTotalAmount: myBazarTotal,
      },
      currentMealRate: {
        rate: currentMealRate,
        totalMeals: mealRateMeals,
        totalBazarAmount: mealRateBazar,
      },
      overview: {
        totalActivities: finalTotalMeals + (bazarData.totalEntries || 0),
        recentActivityCount: Math.min(
          finalTotalMeals + (bazarData.totalEntries || 0),
          10,
        ),
        performanceScore,
      },
    };

    logger.info(
      `Dashboard stats fetched for user ${userId}${useGroup ? ' (group)' : ''}`
    );

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      ETag: `"dashboard-${Date.now()}-${userId}"`,
    });
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
    let userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User context missing',
      });
    }
    if (typeof userId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user context',
        });
      }
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
    logger.error('Error fetching meal stats', {
      error: error?.message,
      stack: error?.stack,
      userId: req.user?._id?.toString?.() || req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal statistics',
    });
  }
});

/**
 * @route   GET /api/user-stats/bazar
 * @desc    Get bazar statistics. For admin/member: main totals are GROUP all-time. For others: user all-time. Always includes myTotalAmountCurrentMonth and groupTotalAmount (this month) when in group.
 * @access  Private
 */
router.get('/bazar', protect, async (req, res) => {
  try {
    let userId = req.user._id || req.user.id;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }

    const monthRange = getCurrentMonthRange();
    const groupMemberIds = await getGroupMemberIds(req.user);
    const useGroup = Array.isArray(groupMemberIds) && groupMemberIds.length > 0;

    const matchStage = useGroup
      ? { userId: { $in: groupMemberIds } }
      : { userId };
    const bazarData = await aggregateStatsAmounts(Bazar, matchStage);

    const averageAmount =
      bazarData.totalEntries > 0
        ? bazarData.totalAmount / bazarData.totalEntries
        : 0;

    const myTotalAmountCurrentMonth = await aggregateSumInDateRange(
      Bazar,
      { userId },
      monthRange
    );

    let groupTotalAmount = null;
    if (useGroup) {
      groupTotalAmount = await aggregateSumInDateRange(
        Bazar,
        { userId: { $in: groupMemberIds } },
        monthRange
      );
    }

    const bazarStatistics = {
      totalAmount: bazarData.totalAmount,
      pendingAmount: bazarData.pendingAmount,
      approvedAmount: bazarData.approvedAmount,
      totalEntries: bazarData.totalEntries,
      averageAmount,
      myTotalAmountCurrentMonth,
      ...(groupTotalAmount !== null && { groupTotalAmount }),
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
