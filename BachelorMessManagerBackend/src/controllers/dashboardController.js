const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class DashboardController {
  // Get dashboard statistics
  async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Get user statistics
      const userStats = await User.getStats();

      // Get meal statistics
      const mealQuery = isAdmin ? {} : { userId };
      const mealStats = await Meal.getStats(mealQuery);

      // Get bazar statistics
      const bazarQuery = isAdmin ? {} : { userId };
      const bazarStats = await Bazar.getStats(bazarQuery);

      // Calculate dashboard metrics
      const stats = {
        totalMembers: userStats.totalUsers || 0,
        activeMembers: userStats.activeUsers || 0,
        totalMeals: mealStats.totalMeals || 0,
        pendingMeals: mealStats.pendingCount || 0,
        totalBazarAmount: bazarStats.totalAmount || 0,
        pendingBazar: bazarStats.pendingCount || 0,
        monthlyExpense: bazarStats.totalAmount || 0,
        averageMeals:
          mealStats.totalMeals > 0
            ? (mealStats.totalMeals / userStats.activeUsers).toFixed(1)
            : 0,
        balance: 0, // This would be calculated based on your business logic
        monthlyBudget: config.business.monthlyBudget || 40000,
        budgetUsed:
          bazarStats.totalAmount > 0
            ? Math.round(
                (bazarStats.totalAmount /
                  (config.business.monthlyBudget || 40000)) *
                  100
              )
            : 0,
      };

      return sendSuccessResponse(
        res,
        200,
        'Dashboard statistics retrieved successfully',
        stats
      );
    } catch (error) {
      next(error);
    }
  }

  // Get recent activities
  async getRecentActivities(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      const { limit = 10 } = req.query;

      const activities = [];

      // Get recent meals
      const mealQuery = isAdmin ? {} : { userId };
      const recentMeals = await Meal.find(mealQuery)
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2);

      // Get recent bazar entries
      const bazarQuery = isAdmin ? {} : { userId };
      const recentBazar = await Bazar.find(bazarQuery)
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2);

      // Combine and format activities
      recentMeals.forEach(meal => {
        activities.push({
          id: meal._id,
          type: 'meal',
          title:
            `${meal.breakfast ? 'Breakfast' : ''}${meal.lunch ? ' Lunch' : ''}${meal.dinner ? ' Dinner' : ''}`.trim(),
          description: `${meal.userId.name} submitted meals for ${new Date(meal.date).toLocaleDateString()}`,
          time: this.getTimeAgo(meal.createdAt),
          priority: meal.status === 'pending' ? 'medium' : 'low',
          amount: 0,
          user: meal.userId.name,
          icon: '🍽️',
          status: meal.status,
        });
      });

      recentBazar.forEach(bazar => {
        activities.push({
          id: bazar._id,
          type: 'bazar',
          title: 'Bazar Entry',
          description: `${bazar.userId.name} submitted bazar entry for ${bazar.totalAmount}`,
          time: this.getTimeAgo(bazar.createdAt),
          priority: bazar.status === 'pending' ? 'medium' : 'low',
          amount: bazar.totalAmount,
          user: bazar.userId.name,
          icon: '🛒',
          status: bazar.status,
        });
      });

      // Sort by creation time
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      return sendSuccessResponse(
        res,
        200,
        'Recent activities retrieved successfully',
        activities.slice(0, parseInt(limit))
      );
    } catch (error) {
      next(error);
    }
  }

  // Get combined dashboard data
  async getCombinedDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Get basic dashboard data
      const dashboardData = {
        message: 'Dashboard data retrieved successfully',
        user: {
          id: userId,
          role: req.user.role,
          isAdmin: isAdmin,
        },
        timestamp: new Date().toISOString(),
        analytics: {
          mealDistribution: [],
          expenseTrend: [],
          categoryBreakdown: [],
          monthlyProgress: { current: 0, target: 100 },
        },
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          totalMeals: 0,
          pendingMeals: 0,
          totalBazarAmount: 0,
          pendingBazar: 0,
          monthlyExpense: 0,
          averageMeals: 0,
          balance: 0,
          monthlyBudget: 40000,
          budgetUsed: 0,
        },
        activities: [],
      };

      return sendSuccessResponse(
        res,
        200,
        'Dashboard data retrieved successfully',
        dashboardData
      );
    } catch (error) {
      next(error);
    }
  }

  // Get analytics data
  async getAnalyticsData(timeframe, userId, isAdmin) {
    try {
      const startDate = this.getStartDate(timeframe);
      const endDate = new Date();

      // Build query
      const query = {};
      if (!isAdmin) {
        query.userId = userId;
      }

      if (startDate) {
        query.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Get meal distribution
      const mealDistribution = await this.getMealDistribution(query, timeframe);

      // Get expense trend
      const expenseTrend = await this.getExpenseTrend(query, timeframe);

      // Get category breakdown
      const categoryBreakdown = await this.getCategoryBreakdown(query);

      // Get monthly progress
      const monthlyProgress = await this.getMonthlyProgress();

      return {
        mealDistribution,
        expenseTrend,
        categoryBreakdown,
        monthlyProgress,
      };
    } catch (error) {
      logger.error('Error getting analytics data:', error);
      return {
        mealDistribution: [],
        expenseTrend: [],
        categoryBreakdown: [],
        monthlyProgress: { current: 0, target: 100 },
      };
    }
  }

  // Get meal distribution
  async getMealDistribution(query, timeframe) {
    try {
      const pipeline = [
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: {
                format: this.getDateFormat(timeframe),
                date: '$date',
              },
            },
            breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
            lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
            dinner: { $sum: { $cond: ['$dinner', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Meal.aggregate(pipeline);

      return result.map(item => ({
        label: item._id,
        value: item.breakfast + item.lunch + item.dinner,
        breakfast: item.breakfast,
        lunch: item.lunch,
        dinner: item.dinner,
        color: '#667eea',
        gradient: ['#667eea', '#764ba2'],
        trend: 'up',
      }));
    } catch (error) {
      logger.error('Error getting meal distribution:', error);
      return [];
    }
  }

  // Get expense trend
  async getExpenseTrend(query, timeframe) {
    try {
      const pipeline = [
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: {
                format: this.getDateFormat(timeframe),
                date: '$date',
              },
            },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Bazar.aggregate(pipeline);

      return result.map(item => ({
        date: item._id,
        value: item.totalAmount,
      }));
    } catch (error) {
      logger.error('Error getting expense trend:', error);
      return [];
    }
  }

  // Get category breakdown
  async getCategoryBreakdown(query) {
    try {
      const pipeline = [
        { $match: query },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalAmount: { $sum: '$items.price' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
      ];

      const result = await Bazar.aggregate(pipeline);

      return result.map((item, index) => ({
        label: item._id,
        value: item.totalAmount,
        count: item.count,
        color: this.getColorByIndex(index),
        gradient: this.getGradientByIndex(index),
      }));
    } catch (error) {
      logger.error('Error getting category breakdown:', error);
      return [];
    }
  }

  // Get monthly progress
  async getMonthlyProgress() {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      const totalAmount = await Bazar.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'approved',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]);

      const current = totalAmount.length > 0 ? totalAmount[0].total : 0;
      const target = config.business.monthlyBudget || 40000;

      return {
        current: Math.round((current / target) * 100),
        target: 100,
      };
    } catch (error) {
      logger.error('Error getting monthly progress:', error);
      return { current: 0, target: 100 };
    }
  }

  // Helper methods
  getStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  getDateFormat(timeframe) {
    switch (timeframe) {
      case 'week':
        return '%Y-%m-%d';
      case 'month':
        return '%Y-%m-%d';
      case 'year':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  getColorByIndex(index) {
    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#f5576c',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#38f9d7',
      '#fa709a',
      '#fee140',
      '#a8edea',
      '#fed6e3',
    ];
    return colors[index % colors.length];
  }

  getGradientByIndex(index) {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#a8edea', '#fed6e3'],
    ];
    return gradients[index % gradients.length];
  }
}

const dashboardController = new DashboardController();

// Bind all methods to preserve 'this' context
const boundController = {};
Object.getOwnPropertyNames(DashboardController.prototype).forEach(method => {
  if (method !== 'constructor') {
    boundController[method] =
      dashboardController[method].bind(dashboardController);
  }
});

module.exports = boundController;
