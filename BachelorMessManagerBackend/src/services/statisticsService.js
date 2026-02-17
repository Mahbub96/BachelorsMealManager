const mongoose = require('mongoose');
const Statistics = require('../models/Statistics');
const { getGroupMemberIds } = require('../utils/groupHelper');
const logger = require('../utils/logger');

class StatisticsService {
  /**
   * Update statistics after any operation
   * @param {string} operation - The operation that was performed
   * @param {Object} data - Additional data about the operation
   */
  static async updateAfterOperation(operation, data = {}) {
    try {
      logger.info(`Updating statistics after operation: ${operation}`, data);

      // Mark current statistics as stale
      const stats = await Statistics.getOrCreate();
      await stats.markStale();

      // Update all statistics
      await Statistics.updateAllStatistics();

      // Update monthly statistics
      await Statistics.updateMonthlyStatistics();

      logger.info('Statistics updated successfully');
    } catch (error) {
      logger.error('Error updating statistics:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get cached statistics
   * @param {boolean} forceUpdate - Force update even if cache is fresh
   */
  static async getStatistics(forceUpdate = false) {
    try {
      let stats = await Statistics.getOrCreate();

      // Check if cache is stale or force update is requested
      const cacheAge = Date.now() - stats.cache.lastSyncTime.getTime();
      const cacheMaxAge = 5 * 60 * 1000; // 5 minutes

      if (forceUpdate || stats.cache.isStale || cacheAge > cacheMaxAge) {
        logger.info('Updating statistics cache');
        await Statistics.updateAllStatistics();
        await Statistics.updateMonthlyStatistics();
        stats = await Statistics.getOrCreate();
      }

      return stats.getFormattedStats();
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    try {
      const stats = await this.getStatistics();

      return {
        success: true,
        data: {
          totalMembers: stats.global.totalUsers,
          activeMembers: stats.global.activeUsers,
          totalMeals: stats.global.totalMeals,
          pendingMeals: stats.meals.pendingMeals,
          totalBazarAmount: stats.bazar.totalAmount,
          pendingBazar: stats.bazar.pendingEntries,
          monthlyExpense: stats.monthly.currentMonth.bazar.totalAmount,
          averageMeals: stats.meals.averageMealsPerDay,
          balance: 0, // Calculate based on your business logic
          monthlyBudget: 40000, // Set based on your requirements
          budgetUsed:
            stats.monthly.currentMonth.bazar.totalAmount > 0
              ? Math.round(
                (stats.monthly.currentMonth.bazar.totalAmount / 40000) * 100,
              )
              : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard statistics',
      };
    }
  }

  /**
   * Get meal statistics
   */
  static async getMealStats() {
    try {
      const stats = await this.getStatistics();

      return {
        success: true,
        data: {
          totalMeals:
            stats.meals.totalBreakfast +
            stats.meals.totalLunch +
            stats.meals.totalDinner,
          totalBreakfast: stats.meals.totalBreakfast,
          totalLunch: stats.meals.totalLunch,
          totalDinner: stats.meals.totalDinner,
          pendingCount: stats.meals.pendingMeals,
          approvedCount: stats.meals.approvedMeals,
          rejectedCount: stats.meals.rejectedMeals,
          efficiency: stats.meals.efficiency,
          averageMealsPerDay: stats.meals.averageMealsPerDay,
        },
      };
    } catch (error) {
      logger.error('Error getting meal stats:', error);
      return {
        success: false,
        error: 'Failed to fetch meal statistics',
      };
    }
  }

  /**
   * Get bazar statistics
   */
  static async getBazarStats() {
    try {
      const stats = await this.getStatistics();

      return {
        success: true,
        data: {
          totalAmount: stats.bazar.totalAmount,
          totalEntries: stats.bazar.totalEntries,
          pendingAmount: 0, // Calculate based on pending entries
          pendingCount: stats.bazar.pendingEntries,
          approvedAmount: 0, // Calculate based on approved entries
          approvedCount: stats.bazar.approvedEntries,
          rejectedAmount: 0, // Calculate based on rejected entries
          rejectedCount: stats.bazar.rejectedEntries,
          averageAmount: stats.bazar.averageAmount,
        },
      };
    } catch (error) {
      logger.error('Error getting bazar stats:', error);
      return {
        success: false,
        error: 'Failed to fetch bazar statistics',
      };
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      const stats = await this.getStatistics();

      return {
        success: true,
        data: {
          totalUsers: stats.global.totalUsers,
          activeUsers: stats.global.activeUsers,
          adminUsers: stats.users.adminUsers,
          memberUsers: stats.users.memberUsers,
          inactiveUsers: stats.users.inactiveUsers,
          newUsersThisMonth: stats.users.newUsersThisMonth,
          activeUsersThisMonth: stats.users.activeUsersThisMonth,
        },
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      return {
        success: false,
        error: 'Failed to fetch user statistics',
      };
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats() {
    try {
      const stats = await this.getStatistics();

      return {
        success: true,
        data: {
          total: stats.global.totalMeals + stats.global.totalBazarEntries,
          byType: {
            meals: stats.global.totalMeals,
            bazar: stats.global.totalBazarEntries,
            members: stats.global.totalUsers,
          },
          byStatus: {
            pending: stats.meals.pendingMeals + stats.bazar.pendingEntries,
            approved: stats.meals.approvedMeals + stats.bazar.approvedEntries,
            rejected: stats.meals.rejectedMeals + stats.bazar.rejectedEntries,
          },
          recent: {
            today:
              stats.daily.today.meals.total +
              stats.daily.today.bazar.totalEntries,
            week:
              stats.weekly.currentWeek.meals.total +
              stats.weekly.currentWeek.bazar.totalEntries,
            month:
              stats.monthly.currentMonth.meals.total +
              stats.monthly.currentMonth.bazar.totalEntries,
          },
        },
      };
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      return {
        success: false,
        error: 'Failed to fetch activity statistics',
      };
    }
  }

  /**
   * Initialize statistics (run once on startup)
   */
  static async initializeStatistics() {
    try {
      logger.info('Initializing statistics...');
      await Statistics.updateAllStatistics();
      await Statistics.updateMonthlyStatistics();
      logger.info('Statistics initialized successfully');
    } catch (error) {
      logger.error('Error initializing statistics:', error);
    }
  }

  /**
   * Schedule periodic statistics updates
   */
  static schedulePeriodicUpdates() {
    // Update statistics every 5 minutes
    setInterval(
      async () => {
        try {
          await Statistics.updateAllStatistics();
          logger.info('Periodic statistics update completed');
        } catch (error) {
          logger.error('Error in periodic statistics update:', error);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    // Update monthly statistics every hour
    setInterval(
      async () => {
        try {
          await Statistics.updateMonthlyStatistics();
          logger.info('Periodic monthly statistics update completed');
        } catch (error) {
          logger.error('Error in periodic monthly statistics update:', error);
        }
      },
      60 * 60 * 1000,
    ); // 1 hour
  }
  /**
   * Get monthly report (group-scoped for admin/member, app-wide for super_admin).
   * @param {number} month - 1-12
   * @param {number} year - Full year (e.g. 2024)
   * @param {Object} [user] - req.user for group scoping (admin sees his group only)
   */
  static async getMonthlyReport(month, year, user = null) {
    const Meal = mongoose.model('Meal');
    const Bazar = mongoose.model('Bazar');
    const User = mongoose.model('User');

    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const groupMemberIds = user ? await getGroupMemberIds(user) : null;
      const mealMatch = {
        date: { $gte: startDate, $lte: endDate },
        status: 'approved',
      };
      if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
        mealMatch.userId = { $in: groupMemberIds };
      }

      const mealStats = await Meal.aggregate([
        {
          $match: mealMatch,
        },
        {
          $group: {
            _id: '$userId',
            totalMeals: {
              $sum: {
                $add: [
                  { $cond: ['$breakfast', 1, 0] },
                  { $cond: ['$lunch', 1, 0] },
                  { $cond: ['$dinner', 1, 0] },
                ],
              },
            },
            totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
            totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
            totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
          },
        },
      ]);

      const bazarMatch = {
        date: { $gte: startDate, $lte: endDate },
        status: 'approved',
      };
      if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
        bazarMatch.userId = { $in: groupMemberIds };
      }

      const bazarStats = await Bazar.aggregate([
        {
          $match: bazarMatch,
        },
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: '$totalAmount' },
            entryCount: { $sum: 1 },
          },
        },
      ]);

      const participantIds = new Set([
        ...mealStats.map(m => m._id.toString()),
        ...bazarStats.map(b => b._id.toString()),
      ]);

      const userQuery = Array.isArray(groupMemberIds) && groupMemberIds.length > 0
        ? { _id: { $in: groupMemberIds } }
        : {
          $or: [
            { _id: { $in: Array.from(participantIds) } },
            { status: 'active' },
          ],
        };
      const users = await User.find(userQuery)
        .select('name email phone profileImage status')
        .lean();

      // Calculate totals
      const totalMeals = mealStats.reduce((sum, item) => sum + item.totalMeals, 0);
      const totalCost = bazarStats.reduce((sum, item) => sum + item.totalAmount, 0);

      // Calculate Meal Rate (Cost / Total Meals)
      // If no meals, rate is 0 to avoid division by zero
      const mealRate = totalMeals > 0 ? totalCost / totalMeals : 0;

      // Map data to users
      const memberReports = users.map(user => {
        const userMeal = mealStats.find(m => m._id.toString() === user._id.toString()) || {
          totalMeals: 0,
          totalBreakfast: 0,
          totalLunch: 0,
          totalDinner: 0,
        };

        const userBazar = bazarStats.find(b => b._id.toString() === user._id.toString()) || {
          totalAmount: 0,
          entryCount: 0,
        };

        const mealCost = userMeal.totalMeals * mealRate;
        const balance = userBazar.totalAmount - mealCost; // Deposit - Cost

        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
          },
          meals: {
            total: userMeal.totalMeals,
            breakfast: userMeal.totalBreakfast,
            lunch: userMeal.totalLunch,
            dinner: userMeal.totalDinner,
          },
          bazar: {
            totalAmount: userBazar.totalAmount,
            entryCount: userBazar.entryCount,
          },
          financial: {
            mealCost: Number(mealCost.toFixed(2)),
            balance: Number(balance.toFixed(2)),
          },
        };
      });

      return {
        success: true,
        data: {
          period: {
            month,
            year,
            startDate,
            endDate,
          },
          summary: {
            totalMeals,
            totalCost,
            mealRate: Number(mealRate.toFixed(2)),
            totalMembers: users.length,
          },
          members: memberReports,
        },
      };

    } catch (error) {
      logger.error('Error generating monthly report:', error);
      return {
        success: false,
        error: 'Failed to generate monthly report',
      };
    }
  }
}

module.exports = StatisticsService;
