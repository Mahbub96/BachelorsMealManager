const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class AnalyticsController {
  // Get analytics data
  async getAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Get basic analytics data
      const analytics = {
        message: 'Analytics data retrieved successfully',
        user: {
          id: userId,
          role: req.user.role,
          isAdmin: isAdmin,
        },
        timestamp: new Date().toISOString(),
        mealDistribution: [],
        expenseTrend: [],
        categoryBreakdown: [],
        monthlyProgress: { current: 0, target: 100 },
        userAnalytics: {
          totalMeals: 0,
          totalExpenses: 0,
          averageMealsPerDay: 0,
          monthlyBudget: 40000,
          budgetUsed: 0,
        },
        systemAnalytics: {
          totalUsers: 0,
          activeUsers: 0,
          totalMeals: 0,
          totalExpenses: 0,
          averageMealsPerUser: 0,
        },
      };

      return sendSuccessResponse(
        res,
        200,
        'Analytics data retrieved successfully',
        analytics
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

  // Get user analytics
  async getUserAnalytics(req, res, next) {
    try {
      const { userId } = req.params;
      const { timeframe = 'month' } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      const startDate = this.getStartDate(timeframe);
      const endDate = new Date();

      const query = {
        userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      // Get user meal analytics
      const mealAnalytics = await this.getUserMealAnalytics(query, timeframe);

      // Get user bazar analytics
      const bazarAnalytics = await this.getUserBazarAnalytics(query, timeframe);

      // Get user performance metrics
      const performanceMetrics = await this.getUserPerformanceMetrics(
        userId,
        query
      );

      const analytics = {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        mealAnalytics,
        bazarAnalytics,
        performanceMetrics,
      };

      return sendSuccessResponse(
        res,
        200,
        'User analytics retrieved successfully',
        analytics
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user meal analytics
  async getUserMealAnalytics(query, timeframe) {
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
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Meal.aggregate(pipeline);

      return {
        totalMeals: result.reduce((sum, item) => sum + item.total, 0),
        totalBreakfast: result.reduce((sum, item) => sum + item.breakfast, 0),
        totalLunch: result.reduce((sum, item) => sum + item.lunch, 0),
        totalDinner: result.reduce((sum, item) => sum + item.dinner, 0),
        dailyBreakdown: result.map(item => ({
          date: item._id,
          breakfast: item.breakfast,
          lunch: item.lunch,
          dinner: item.dinner,
          total: item.total,
        })),
      };
    } catch (error) {
      logger.error('Error getting user meal analytics:', error);
      return {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        dailyBreakdown: [],
      };
    }
  }

  // Get user bazar analytics
  async getUserBazarAnalytics(query, timeframe) {
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
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Bazar.aggregate(pipeline);

      return {
        totalAmount: result.reduce((sum, item) => sum + item.totalAmount, 0),
        totalEntries: result.reduce((sum, item) => sum + item.count, 0),
        averageAmount:
          result.length > 0
            ? result.reduce((sum, item) => sum + item.totalAmount, 0) /
              result.length
            : 0,
        dailyBreakdown: result.map(item => ({
          date: item._id,
          amount: item.totalAmount,
          count: item.count,
        })),
      };
    } catch (error) {
      logger.error('Error getting user bazar analytics:', error);
      return {
        totalAmount: 0,
        totalEntries: 0,
        averageAmount: 0,
        dailyBreakdown: [],
      };
    }
  }

  // Get user performance metrics
  async getUserPerformanceMetrics(userId, query) {
    try {
      // Get meal consistency
      const mealConsistency = await Meal.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            daysWithMeals: {
              $sum: {
                $cond: [{ $or: ['$breakfast', '$lunch', '$dinner'] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get bazar contribution
      const bazarContribution = await Bazar.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalEntries: { $sum: 1 },
          },
        },
      ]);

      const consistency =
        mealConsistency.length > 0
          ? (
              (mealConsistency[0].daysWithMeals /
                mealConsistency[0].totalDays) *
              100
            ).toFixed(1)
          : 0;

      const contribution =
        bazarContribution.length > 0 ? bazarContribution[0].totalAmount : 0;

      return {
        mealConsistency: parseFloat(consistency),
        bazarContribution: contribution,
        averageDailyMeals:
          mealConsistency.length > 0
            ? (
                mealConsistency[0].daysWithMeals / mealConsistency[0].totalDays
              ).toFixed(1)
            : 0,
        averageBazarAmount:
          bazarContribution.length > 0
            ? (
                bazarContribution[0].totalAmount /
                bazarContribution[0].totalEntries
              ).toFixed(2)
            : 0,
      };
    } catch (error) {
      logger.error('Error getting user performance metrics:', error);
      return {
        mealConsistency: 0,
        bazarContribution: 0,
        averageDailyMeals: 0,
        averageBazarAmount: 0,
      };
    }
  }

  // Get system analytics (admin only)
  async getSystemAnalytics(req, res, next) {
    try {
      const { timeframe = 'month' } = req.query;

      const startDate = this.getStartDate(timeframe);
      const endDate = new Date();

      const query = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      // Get system-wide meal analytics
      const mealAnalytics = await this.getSystemMealAnalytics(query, timeframe);

      // Get system-wide bazar analytics
      const bazarAnalytics = await this.getSystemBazarAnalytics(
        query,
        timeframe
      );

      // Get user activity analytics
      const userAnalytics = await this.getSystemUserAnalytics(query, timeframe);

      const analytics = {
        mealAnalytics,
        bazarAnalytics,
        userAnalytics,
      };

      return sendSuccessResponse(
        res,
        200,
        'System analytics retrieved successfully',
        analytics
      );
    } catch (error) {
      next(error);
    }
  }

  // Get system meal analytics
  async getSystemMealAnalytics(query, timeframe) {
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
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Meal.aggregate(pipeline);

      return {
        totalMeals: result.reduce((sum, item) => sum + item.total, 0),
        totalBreakfast: result.reduce((sum, item) => sum + item.breakfast, 0),
        totalLunch: result.reduce((sum, item) => sum + item.lunch, 0),
        totalDinner: result.reduce((sum, item) => sum + item.dinner, 0),
        dailyBreakdown: result.map(item => ({
          date: item._id,
          breakfast: item.breakfast,
          lunch: item.lunch,
          dinner: item.dinner,
          total: item.total,
        })),
      };
    } catch (error) {
      logger.error('Error getting system meal analytics:', error);
      return {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        dailyBreakdown: [],
      };
    }
  }

  // Get system bazar analytics
  async getSystemBazarAnalytics(query, timeframe) {
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
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await Bazar.aggregate(pipeline);

      return {
        totalAmount: result.reduce((sum, item) => sum + item.totalAmount, 0),
        totalEntries: result.reduce((sum, item) => sum + item.count, 0),
        averageAmount:
          result.length > 0
            ? result.reduce((sum, item) => sum + item.totalAmount, 0) /
              result.length
            : 0,
        dailyBreakdown: result.map(item => ({
          date: item._id,
          amount: item.totalAmount,
          count: item.count,
        })),
      };
    } catch (error) {
      logger.error('Error getting system bazar analytics:', error);
      return {
        totalAmount: 0,
        totalEntries: 0,
        averageAmount: 0,
        dailyBreakdown: [],
      };
    }
  }

  // Get system user analytics
  async getSystemUserAnalytics(query, timeframe) {
    try {
      // Get user registration trends
      const userRegistration = await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: query.date.$gte,
              $lte: query.date.$lte,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: this.getDateFormat(timeframe),
                date: '$createdAt',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get active users
      const activeUsers = await User.countDocuments({ status: 'active' });

      // Get user activity
      const userActivity = await User.aggregate([
        {
          $match: {
            lastLogin: {
              $gte: query.date.$gte,
              $lte: query.date.$lte,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: this.getDateFormat(timeframe),
                date: '$lastLogin',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        totalUsers: await User.countDocuments(),
        activeUsers,
        newUsers: userRegistration.reduce((sum, item) => sum + item.count, 0),
        userRegistration: userRegistration.map(item => ({
          date: item._id,
          count: item.count,
        })),
        userActivity: userActivity.map(item => ({
          date: item._id,
          count: item.count,
        })),
      };
    } catch (error) {
      logger.error('Error getting system user analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        userRegistration: [],
        userActivity: [],
      };
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

module.exports = new AnalyticsController();
