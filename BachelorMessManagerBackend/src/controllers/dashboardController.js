const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse } = require('../utils/responseHandler');
const {
  resolveScope,
  buildMealMatch,
  buildBazarMatch,
  getScopeMemberCount,
  countTodayMeals,
  getTodayMealsBreakdown,
  buildCurrentMonthDateFilter,
  mealBazarMatch,
} = require('../utils/scopeHelper');
const { aggregateMealStats } = require('../utils/mealHelper');

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const scope = await resolveScope(req.user);
      const dateFilter = buildCurrentMonthDateFilter();

      const mealMatchMonth = buildMealMatch(scope, dateFilter);
      const bazarMatchMonth = buildBazarMatch(scope, dateFilter, mealBazarMatch());

      const [mealData, totalBazarResult, pendingMeals, pendingBazar, todayBreakdown, userCount] = await Promise.all([
        aggregateMealStats(Meal, mealMatchMonth),
        Bazar.aggregate([
          { $match: bazarMatchMonth },
          { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
        ]),
        Meal.countDocuments({ ...mealMatchMonth, status: 'pending' }),
        Bazar.countDocuments({ ...bazarMatchMonth, status: 'pending' }),
        getTodayMealsBreakdown(Meal, scope),
        getScopeMemberCount(scope),
      ]);

      const totalMeals = mealData.totalMeals;
      const totalBazarAmount = totalBazarResult[0]?.totalAmount ?? 0;
      const averageMeals = userCount > 0 ? Number((totalMeals / userCount).toFixed(1)) : 0;
      const monthlyBudget = config.business?.monthlyBudget || 40000;
      const budgetUsed = monthlyBudget > 0 ? Math.round((totalBazarAmount / monthlyBudget) * 100) : 0;

      const stats = {
        totalMembers: userCount,
        activeMembers: userCount,
        totalMeals,
        pendingMeals,
        approvedMeals: mealData.approvedCount ?? 0,
        totalBazarAmount,
        pendingBazar,
        monthlyExpense: totalBazarAmount,
        averageMeals,
        balance: 0,
        monthlyBudget,
        budgetUsed,
        todayMeals: todayBreakdown.total,
        todayBreakfast: todayBreakdown.breakfast,
        todayLunch: todayBreakdown.lunch,
        todayDinner: todayBreakdown.dinner,
      };

      logger.info(`Dashboard stats calculated successfully for user: ${scope.userId}`);

      return sendSuccessResponse(
        res,
        200,
        'Dashboard statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
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
          icon: 'restaurant',
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

      // Get basic stats data directly
      const statsData = await this.getDashboardStatsData(userId, isAdmin);

      // Get recent activities data directly
      const activitiesData = await this.getRecentActivitiesData(
        userId,
        isAdmin
      );

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

      const weeklyData = [];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);

        // Create date range for the specific day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query = {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
        if (!isAdmin) {
          query.userId = userId;
        }

        logger.debug(`Querying meals for ${date.toDateString()}`, { query });
        const meals = await Meal.find(query);
        logger.debug(`Found ${meals.length} meals for ${date.toDateString()}`);

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

      // Get data for the last 6 months instead of 4
      for (let i = 5; i >= 0; i--) {
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

        // Calculate expenses (mock data for now - in real app this would be from a separate expenses collection)
        const expenses = Math.round(totalAmount * 0.7); // 70% of revenue goes to expenses

        // Calculate profit
        const profit = totalAmount - expenses;

        // Calculate member count (mock data)
        const memberCount = Math.floor(Math.random() * 10) + 5; // 5-15 members

        monthlyData.push({
          date: monthName,
          value: totalAmount,
          forecast: Math.round(totalAmount * 1.05), // Simple forecast
          expenses: expenses,
          profit: profit,
          memberCount: memberCount,
          details: {
            expenses: expenses,
            profit: profit,
            memberCount: memberCount,
            entryCount: bazarEntries.length,
          },
        });
      }

      logger.debug('Monthly revenue data calculated', {
        dataPoints: monthlyData.length,
      });

      return monthlyData;
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
          percentage: 0.6, // 60% of total expenses
        },
        {
          name: 'Utilities',
          percentage: 0.25, // 25% of total expenses
        },
        {
          name: 'Maintenance',
          percentage: 0.1, // 10% of total expenses
        },
        {
          name: 'Others',
          percentage: 0.05, // 5% of total expenses
        },
      ];

      const breakdownData = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Get total expenses for current month
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
      const totalExpenses = bazarEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0
      );

      // If no real data, use a reasonable default
      const baseExpenses = totalExpenses > 0 ? totalExpenses : 5000;

      for (const category of categories) {
        const categoryAmount = Math.round(baseExpenses * category.percentage);
        const forecastAmount = Math.round(categoryAmount * 1.02); // 2% increase forecast

        breakdownData.push({
          label: category.name,
          value: categoryAmount,
          forecast: forecastAmount,
          trend: forecastAmount > categoryAmount ? 'up' : 'stable',
          details: {
            percentage: Math.round(category.percentage * 100),
            description: `${category.name} expenses for current month`,
          },
        });
      }

      logger.debug('Expense breakdown calculated', {
        categories: breakdownData.length,
      });

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

  // Helper method to get dashboard stats data
  async getDashboardStatsData(userId, isAdmin) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Build query based on user role
      const query = {};
      if (!isAdmin) {
        query.userId = userId;
      }

      // Get total members
      const totalMembers = await User.countDocuments();

      // Get monthly expenses (bazar entries)
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const monthlyBazarQuery = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
        ...query,
      };

      const monthlyBazarEntries = await Bazar.find(monthlyBazarQuery);
      const monthlyExpense = monthlyBazarEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0
      );

      // Get total meals for current month
      const monthlyMealsQuery = {
        date: {
          $gte: startOfMonth.toISOString().split('T')[0],
          $lte: endOfMonth.toISOString().split('T')[0],
        },
        ...query,
      };

      const monthlyMeals = await Meal.find(monthlyMealsQuery);
      const totalMeals = monthlyMeals.reduce((sum, meal) => {
        return (
          sum +
          (meal.breakfast ? 1 : 0) +
          (meal.lunch ? 1 : 0) +
          (meal.dinner ? 1 : 0)
        );
      }, 0);

      // Calculate average meals per day
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const averageMeals =
        daysInMonth > 0 ? Math.round(totalMeals / daysInMonth) : 0;

      // Get balance (mock data for now)
      const balance = 5000; // This should be calculated based on actual payment logic

      // Get pending payments (mock data for now)
      const pendingPayments = 2;

      // Get monthly budget (mock data for now)
      const monthlyBudget = 15000;

      // Calculate budget used percentage
      const budgetUsed = Math.round((monthlyExpense / monthlyBudget) * 100);

      return {
        totalMembers,
        monthlyExpense,
        averageMeals,
        balance,
        totalMeals,
        pendingPayments,
        monthlyBudget,
        budgetUsed,
      };
    } catch (error) {
      logger.error('Error getting dashboard stats data:', error);
      return {
        totalMembers: 0,
        monthlyExpense: 0,
        averageMeals: 0,
        balance: 0,
        totalMeals: 0,
        pendingPayments: 0,
        monthlyBudget: 0,
        budgetUsed: 0,
      };
    }
  }

  // Helper method to get recent activities data
  async getRecentActivitiesData(userId, isAdmin) {
    try {
      const activities = [];

      // Get recent meals
      const recentMealsQuery = {};
      if (!isAdmin) {
        recentMealsQuery.userId = userId;
      }

      const recentMeals = await Meal.find(recentMealsQuery)
        .sort({ date: -1 })
        .limit(5)
        .populate('userId', 'name');

      for (const meal of recentMeals) {
        const mealTypes = [];
        if (meal.breakfast) mealTypes.push('Breakfast');
        if (meal.lunch) mealTypes.push('Lunch');
        if (meal.dinner) mealTypes.push('Dinner');

        if (mealTypes.length > 0) {
          activities.push({
            id: meal._id.toString(),
            type: 'meal',
            title: `${mealTypes.join(', ')} Added`,
            description: `Meal recorded for ${meal.date}`,
            time: this.getTimeAgo(meal.createdAt),
            priority: 'low',
            user: meal.userId?.name || 'Unknown',
            icon: 'restaurant',
          });
        }
      }

      // Get recent bazar entries
      const recentBazarQuery = {};
      if (!isAdmin) {
        recentBazarQuery.userId = userId;
      }

      const recentBazar = await Bazar.find(recentBazarQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name');

      for (const bazar of recentBazar) {
        activities.push({
          id: bazar._id.toString(),
          type: 'bazar',
          title: 'Bazar Entry Added',
          description: `${bazar.items.length} items purchased for ${bazar.totalAmount}৳`,
          time: this.getTimeAgo(bazar.createdAt),
          priority: 'medium',
          amount: bazar.totalAmount,
          user: bazar.userId?.name || 'Unknown',
          icon: '🛒',
        });
      }

      // Sort activities by time (most recent first)
      activities.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
      });

      return activities.slice(0, 10); // Return top 10 activities
    } catch (error) {
      logger.error('Error getting recent activities data:', error);
      return [];
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

const dashboardController = new DashboardController();

// Bind methods to preserve 'this' context
const boundController = {
  getDashboardStats:
    dashboardController.getDashboardStats.bind(dashboardController),
  getRecentActivities:
    dashboardController.getRecentActivities.bind(dashboardController),
  getCombinedDashboard:
    dashboardController.getCombinedDashboard.bind(dashboardController),
};

module.exports = boundController;
