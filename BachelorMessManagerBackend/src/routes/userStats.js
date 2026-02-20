const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const User = require('../models/User');
const logger = require('../utils/logger');
const { getGroupMemberIds } = require('../utils/groupHelper');
const {
  getCurrentMonthRange,
  buildCurrentMonthDateFilter,
  aggregateStatsAmounts,
  mealBazarMatch,
  flatBazarMatch,
  buildUserScopeMatch,
  getBazarSumInMonth,
} = require('../utils/bazarHelper');
const { aggregateMealStats, aggregateMealLastDate } = require('../utils/mealHelper');
const {
  normalizeUserId,
  daysSince,
  ratioPercent,
  safeAverage,
} = require('../utils/userStatsHelper');

/**
 * @route   GET /api/user-stats/dashboard
 * @desc    Get comprehensive user dashboard statistics (group-scoped for admin/member)
 * @access  Private
 * - All card numbers use CURRENT MONTH only so they match UI "this month" and MongoDB.
 * - Meal rate = group total MEAL bazar / group total meals (current month). Flat bazar excluded.
 * - lastMealDate = all-time so "days since last meal" is meaningful.
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = normalizeUserId(req, res);
    if (!userId) return;

    const currentDate = new Date();
    const monthRange = getCurrentMonthRange();
    const dateFilter = buildCurrentMonthDateFilter(monthRange);
    const mealOnlyFilter = mealBazarMatch();

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
      totalGuestMeals: 0,
      totalEntries: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      lastMealDate: null,
    };
    const scopeMatch = buildUserScopeMatch(userId, groupMemberIds);
    const mealMatchMonth = { ...mealOnlyFilter, ...scopeMatch, ...dateFilter };

    if (useGroup) {
      const mealMatchMonthGroup = { userId: { $in: groupMemberIds }, ...dateFilter };
      mealData = await aggregateMealStats(Meal, mealMatchMonthGroup);
      mealData.lastMealDate = await aggregateMealLastDate(Meal, { userId: { $in: groupMemberIds } });
      finalTotalMeals = mealData.totalMeals;
    } else {
      const mealMatchMonthUser = { userId, ...dateFilter };
      mealData = await aggregateMealStats(Meal, mealMatchMonthUser);
      mealData.lastMealDate = await aggregateMealLastDate(Meal, { userId });
      finalTotalMeals = mealData.totalMeals;
    }

    const bazarData = await aggregateStatsAmounts(Bazar, mealMatchMonth);
    const [groupMealBazarSum, myBazarTotal, flatBazarTotalAmount] = await Promise.all([
      getBazarSumInMonth(Bazar, mealBazarMatch(), userId, groupMemberIds, monthRange),
      getBazarSumInMonth(Bazar, mealBazarMatch(), userId, null, monthRange),
      getBazarSumInMonth(Bazar, flatBazarMatch(), userId, groupMemberIds, monthRange),
    ]);
    const flatBazarMemberCount = (groupMemberIds && groupMemberIds.length > 0) ? groupMemberIds.length : 1;

    mealData._mealRateMeals = finalTotalMeals;
    bazarData._mealRateBazar = groupMealBazarSum;

    const daysSinceLastMeal = daysSince(mealData.lastMealDate, currentDate);
    const mealEfficiency = ratioPercent(mealData.approvedCount, mealData.totalEntries);
    const currentDayOfMonth = currentDate.getDate();
    const averageMealsPerDay =
      currentDayOfMonth > 0 ? mealData.totalMeals / currentDayOfMonth : 0;
    const averageAmount = safeAverage(bazarData.totalAmount, bazarData.totalEntries);
    const bazarEfficiency = ratioPercent(bazarData.approvedAmount, bazarData.totalAmount);
    const performanceScore = Math.round((mealEfficiency + bazarEfficiency) / 2);

    const mealRateBazar = bazarData._mealRateBazar !== undefined ? bazarData._mealRateBazar : bazarData.totalAmount;
    const mealRateMeals = mealData._mealRateMeals !== undefined ? mealData._mealRateMeals : finalTotalMeals;
    const currentMealRate =
      mealRateMeals > 0 ? mealRateBazar / mealRateMeals : 0;
    delete bazarData._mealRateBazar;
    delete mealData._mealRateMeals;

    const guestMealsCount = mealData.totalGuestMeals || 0;
    const totalMealsWithGuest = finalTotalMeals; // already includes guest from aggregation
    const flatSharePerPerson =
      flatBazarMemberCount > 0 ? flatBazarTotalAmount / flatBazarMemberCount : 0;
    const dashboardStats = {
      meals: {
        total: totalMealsWithGuest,
        guestMeals: guestMealsCount,
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
      flatBazar: {
        totalAmount: flatBazarTotalAmount,
        memberCount: flatBazarMemberCount,
        sharePerPerson: flatSharePerPerson,
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
    const userId = normalizeUserId(req, res);
    if (!userId) return;

    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const mealData = await aggregateMealStats(Meal, { userId }, { includeLastMealDate: true });
    const daysSinceLastMeal = daysSince(mealData.lastMealDate, currentDate);
    const efficiency = ratioPercent(mealData.approvedCount, mealData.totalEntries);

    const recentMeals = await Meal.countDocuments({
      userId,
      date: { $gte: thirtyDaysAgo },
    });
    const averagePerDay = recentMeals / 30;

    const mealStatistics = {
      total: mealData.totalMeals,
      guestMeals: mealData.totalGuestMeals || 0,
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
    const userId = normalizeUserId(req, res);
    if (!userId) return;

    const monthRange = getCurrentMonthRange();
    let groupMemberIds = null;
    try {
      groupMemberIds = await getGroupMemberIds(req.user);
    } catch (groupErr) {
      logger.warn('getGroupMemberIds failed in bazar stats, using single-user scope', {
        error: groupErr?.message,
        userId: userId?.toString(),
      });
    }
    const useGroup = Array.isArray(groupMemberIds) && groupMemberIds.length > 0;
    const mealOnlyFilter = mealBazarMatch();

    const scopeMatch = buildUserScopeMatch(userId, groupMemberIds);
    const matchStage = { ...mealOnlyFilter, ...scopeMatch };
    const bazarData = await aggregateStatsAmounts(Bazar, matchStage);

    const averageAmount = safeAverage(bazarData.totalAmount, bazarData.totalEntries);

    const [myTotalAmountCurrentMonth, groupTotalAmount] = await Promise.all([
      getBazarSumInMonth(Bazar, mealOnlyFilter, userId, null, monthRange),
      useGroup ? getBazarSumInMonth(Bazar, mealOnlyFilter, userId, groupMemberIds, monthRange) : null,
    ]);

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
    const userId = normalizeUserId(req, res);
    if (!userId) return;

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
