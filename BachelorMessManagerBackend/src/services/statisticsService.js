const Statistics = require('../models/Statistics');
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
                  (stats.monthly.currentMonth.bazar.totalAmount / 40000) * 100
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
      5 * 60 * 1000
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
      60 * 60 * 1000
    ); // 1 hour
  }
}

module.exports = StatisticsService;
