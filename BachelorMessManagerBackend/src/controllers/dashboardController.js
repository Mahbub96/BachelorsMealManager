const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse } = require('../utils/responseHandler');

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
        monthlyBudget: config.business?.monthlyBudget || 40000,
        budgetUsed:
          bazarStats.totalAmount > 0
            ? Math.round(
                (bazarStats.totalAmount /
                  (config.business?.monthlyBudget || 40000)) *
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
          description: `${bazar.userId.name} submitted bazar entry for ৳${bazar.totalAmount}`,
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
      const { timeframe = 'week' } = req.query;

      // Get analytics data
      const analytics = await this.getAnalyticsData(timeframe, userId, isAdmin);

      // Get basic stats
      const stats = await this.getDashboardStats(req, res, next);
      const statsData = stats.data || {};

      // Get recent activities
      const activities = await this.getRecentActivities(req, res, next);
      const activitiesData = activities.data || [];

      // Get weekly meals data
      const weeklyMealsData = await this.getWeeklyMealsData(userId, isAdmin);

      // Get monthly revenue data
      const monthlyRevenueData = await this.getMonthlyRevenueData(
        userId,
        isAdmin
      );

      // Get expense breakdown data
      const expenseBreakdownData = await this.getExpenseBreakdownData(
        userId,
        isAdmin
      );

      const dashboardData = {
        message: 'Dashboard data retrieved successfully',
        user: {
          id: userId,
          role: req.user.role,
          isAdmin: isAdmin,
        },
        timestamp: new Date().toISOString(),
        analytics: analytics,
        stats: statsData,
        activities: activitiesData,
        charts: {
          weeklyMeals: weeklyMealsData,
          monthlyRevenue: monthlyRevenueData,
          expenseBreakdown: expenseBreakdownData,
        },
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

  // Get weekly meals data for charts
  async getWeeklyMealsData(userId, isAdmin) {
    try {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const colors = [
        '#f59e0b',
        '#10b981',
        '#6366f1',
        '#f093fb',
        '#43e97b',
        '#667eea',
        '#f97316',
      ];
      const gradients = [
        ['#fbbf24', '#f59e0b'],
        ['#34d399', '#10b981'],
        ['#818cf8', '#6366f1'],
        ['#f093fb', '#f5576c'],
        ['#43e97b', '#38f9d7'],
        ['#667eea', '#764ba2'],
        ['#fb923c', '#f97316'],
      ];

      const weeklyData = [];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);

        const query = { date: date.toISOString().split('T')[0] };
        if (!isAdmin) {
          query.userId = userId;
        }

        const meals = await Meal.find(query);
        const totalMeals = meals.reduce((sum, meal) => {
          return (
            sum +
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0)
          );
        }, 0);

        weeklyData.push({
          label: days[i],
          value: totalMeals,
          forecast: Math.round(totalMeals * 1.1), // Simple forecast
          color: colors[i],
          gradient: gradients[i],
          trend:
            i > 0
              ? totalMeals > weeklyData[i - 1]?.value
                ? 'up'
                : 'down'
              : 'up',
        });
      }

      return weeklyData;
    } catch (error) {
      logger.error('Error getting weekly meals data:', error);
      return [];
    }
  }

  // Get monthly revenue data for charts
  async getMonthlyRevenueData(userId, isAdmin) {
    try {
      const monthlyData = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < 4; i++) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });

        // Get bazar data for this month
        const startOfMonth = new Date(currentYear, currentMonth - i, 1);
        const endOfMonth = new Date(currentYear, currentMonth - i + 1, 0);

        const query = {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        };
        if (!isAdmin) {
          query.userId = userId;
        }

        const bazarEntries = await Bazar.find(query);
        const totalAmount = bazarEntries.reduce(
          (sum, entry) => sum + entry.totalAmount,
          0
        );

        monthlyData.push({
          date: monthName,
          value: totalAmount,
          forecast: Math.round(totalAmount * 1.05), // Simple forecast
        });
      }

      return monthlyData.reverse();
    } catch (error) {
      logger.error('Error getting monthly revenue data:', error);
      return [];
    }
  }

  // Get expense breakdown data for charts
  async getExpenseBreakdownData(userId, isAdmin) {
    try {
      const categories = [
        {
          name: 'Groceries',
          color: '#10b981',
          gradient: ['#34d399', '#10b981'],
        },
        {
          name: 'Utilities',
          color: '#6366f1',
          gradient: ['#818cf8', '#6366f1'],
        },
        {
          name: 'Maintenance',
          color: '#f59e0b',
          gradient: ['#fbbf24', '#f59e0b'],
        },
        { name: 'Others', color: '#f093fb', gradient: ['#f093fb', '#f5576c'] },
      ];

      const breakdownData = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for (const category of categories) {
        // For now, we'll use mock data since we don't have category field in Bazar model
        // In a real implementation, you'd query by category
        const query = {
          createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0),
          },
        };
        if (!isAdmin) {
          query.userId = userId;
        }

        const bazarEntries = await Bazar.find(query);
        const totalAmount = bazarEntries.reduce(
          (sum, entry) => sum + entry.totalAmount,
          0
        );

        // Distribute amount across categories (mock implementation)
        const categoryAmount = Math.round(
          totalAmount * (Math.random() * 0.4 + 0.1)
        );

        breakdownData.push({
          label: category.name,
          value: categoryAmount,
          forecast: Math.round(categoryAmount * 1.02),
          color: category.color,
          gradient: category.gradient,
        });
      }

      return breakdownData;
    } catch (error) {
      logger.error('Error getting expense breakdown data:', error);
      return [];
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

      return result.map((item, index) => ({
        label: item._id,
        value: item.breakfast + item.lunch + item.dinner,
        color: this.getColorByIndex(index),
        gradient: this.getGradientByIndex(index),
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
                date: '$createdAt',
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
      // For now, return mock data since we don't have categories in the model
      const categories = [
        {
          label: 'Groceries',
          value: 45,
          color: '#10b981',
          gradient: ['#34d399', '#10b981'],
        },
        {
          label: 'Utilities',
          value: 25,
          color: '#6366f1',
          gradient: ['#818cf8', '#6366f1'],
        },
        {
          label: 'Maintenance',
          value: 20,
          color: '#f59e0b',
          gradient: ['#fbbf24', '#f59e0b'],
        },
        {
          label: 'Others',
          value: 10,
          color: '#f093fb',
          gradient: ['#f093fb', '#f5576c'],
        },
      ];

      return categories;
    } catch (error) {
      logger.error('Error getting category breakdown:', error);
      return [];
    }
  }

  // Get monthly progress
  async getMonthlyProgress() {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Get total meals for current month
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const meals = await Meal.find({
        date: {
          $gte: startOfMonth.toISOString().split('T')[0],
          $lte: endOfMonth.toISOString().split('T')[0],
        },
      });

      const totalMeals = meals.reduce((sum, meal) => {
        return (
          sum +
          (meal.breakfast ? 1 : 0) +
          (meal.lunch ? 1 : 0) +
          (meal.dinner ? 1 : 0)
        );
      }, 0);

      // Target is 100 meals per month (example)
      const target = 100;

      return {
        current: totalMeals,
        target: target,
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
        return '%Y-%m';
      case 'year':
        return '%Y';
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
      '#f59e0b',
      '#10b981',
      '#6366f1',
      '#f093fb',
      '#43e97b',
      '#667eea',
      '#f97316',
    ];
    return colors[index % colors.length];
  }

  getGradientByIndex(index) {
    const gradients = [
      ['#fbbf24', '#f59e0b'],
      ['#34d399', '#10b981'],
      ['#818cf8', '#6366f1'],
      ['#f093fb', '#f5576c'],
      ['#43e97b', '#38f9d7'],
      ['#667eea', '#764ba2'],
      ['#fb923c', '#f97316'],
    ];
    return gradients[index % gradients.length];
  }
}

module.exports = new DashboardController();
