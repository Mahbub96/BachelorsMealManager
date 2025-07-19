const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class UserController {
  // Get user profile
  async getUserProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      return sendSuccessResponse(
        res,
        200,
        'User profile retrieved successfully',
        user
      );
    } catch (error) {
      logger.error('Error in getUserProfile:', error);
      next(error);
    }
  }

  // Update user profile
  async updateUserProfile(req, res, next) {
    try {
      const { name, email, phone, address } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (address) user.address = address;

      await user.save();

      const updatedUser = await User.findById(req.user.id).select('-password');

      return sendSuccessResponse(
        res,
        200,
        'Profile updated successfully',
        updatedUser
      );
    } catch (error) {
      logger.error('Error in updateUserProfile:', error);
      next(error);
    }
  }

  // Get user statistics
  async getUserStats(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUser = req.user;

      // Check if user is admin or requesting their own stats
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        return sendErrorResponse(res, 403, 'Access denied');
      }

      const stats = await this.calculateUserStats(userId);

      return sendSuccessResponse(
        res,
        200,
        'User statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Error in getUserStats:', error);
      next(error);
    }
  }

  // Get current user statistics
  async getCurrentUserStats(req, res, next) {
    try {
      const stats = await this.calculateUserStats(req.user.id);

      return sendSuccessResponse(
        res,
        200,
        'User statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Error in getCurrentUserStats:', error);
      next(error);
    }
  }

  // Get user dashboard data
  async getUserDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      // Get comprehensive user dashboard data
      const dashboardData = await this.getUserDashboardData(userId);

      return sendSuccessResponse(
        res,
        200,
        'User dashboard data retrieved successfully',
        dashboardData
      );
    } catch (error) {
      logger.error('Error in getUserDashboard:', error);
      next(error);
    }
  }

  // Calculate user statistics
  async calculateUserStats(userId) {
    try {
      // Get meal statistics
      const mealStats = await this.getMealStats(userId);

      // Get bazar statistics
      const bazarStats = await this.getBazarStats(userId);

      // Get payment statistics
      const paymentStats = await this.getPaymentStats(userId);

      // Get overview statistics
      const overviewStats = await this.getOverviewStats(userId);

      return {
        meals: mealStats,
        bazar: bazarStats,
        payments: paymentStats,
        overview: overviewStats,
      };
    } catch (error) {
      logger.error('Error calculating user stats:', error);
      throw error;
    }
  }

  // Get meal statistics for user
  async getMealStats(userId) {
    try {
      const totalMeals = await Meal.countDocuments({ userId });
      const approvedMeals = await Meal.countDocuments({
        userId,
        status: 'approved',
      });
      const pendingMeals = await Meal.countDocuments({
        userId,
        status: 'pending',
      });
      const rejectedMeals = await Meal.countDocuments({
        userId,
        status: 'rejected',
      });

      // Calculate efficiency percentage
      const efficiency =
        totalMeals > 0 ? Math.round((approvedMeals / totalMeals) * 100) : 0;

      // Calculate average meals per day
      const user = await User.findById(userId);
      const joinDate = user?.createdAt || new Date();
      const daysSinceJoin = Math.ceil(
        (new Date() - joinDate) / (1000 * 60 * 60 * 24)
      );
      const averagePerDay =
        daysSinceJoin > 0 ? (totalMeals / daysSinceJoin).toFixed(1) : 0;

      // Get days since last meal
      const lastMeal = await Meal.findOne({ userId }).sort({ date: -1 });
      const daysSinceLastMeal = lastMeal
        ? Math.ceil(
            (new Date() - new Date(lastMeal.date)) / (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        total: totalMeals,
        approved: approvedMeals,
        pending: pendingMeals,
        rejected: rejectedMeals,
        efficiency: efficiency,
        averagePerDay: parseFloat(averagePerDay),
        daysSinceLastMeal: daysSinceLastMeal,
      };
    } catch (error) {
      logger.error('Error getting meal stats:', error);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        efficiency: 0,
        averagePerDay: 0,
        daysSinceLastMeal: 0,
      };
    }
  }

  // Get bazar statistics for user
  async getBazarStats(userId) {
    try {
      const bazarEntries = await Bazar.find({ userId });

      const totalAmount = bazarEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0
      );
      const pendingAmount = bazarEntries
        .filter(entry => entry.status === 'pending')
        .reduce((sum, entry) => sum + entry.totalAmount, 0);
      const approvedAmount = bazarEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + entry.totalAmount, 0);

      const totalEntries = bazarEntries.length;
      const averageAmount =
        totalEntries > 0 ? (totalAmount / totalEntries).toFixed(0) : 0;

      return {
        totalAmount: totalAmount,
        pendingAmount: pendingAmount,
        approvedAmount: approvedAmount,
        totalEntries: totalEntries,
        averageAmount: parseFloat(averageAmount),
      };
    } catch (error) {
      logger.error('Error getting bazar stats:', error);
      return {
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        totalEntries: 0,
        averageAmount: 0,
      };
    }
  }

  // Get payment statistics for user
  async getPaymentStats(userId) {
    try {
      // For now, we'll use mock data since we don't have a Payment model
      // In a real implementation, you'd query the Payment collection
      const monthlyContribution = 5000; // This would come from user settings or system config

      // Get last bazar entry date as proxy for last payment
      const lastBazarEntry = await Bazar.findOne({ userId }).sort({
        createdAt: -1,
      });
      const lastPaymentDate = lastBazarEntry
        ? lastBazarEntry.createdAt.toISOString().split('T')[0]
        : null;

      // Calculate payment status based on bazar entries
      const bazarEntries = await Bazar.find({ userId });
      const totalPaid = bazarEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + entry.totalAmount, 0);

      let paymentStatus = 'pending';
      if (totalPaid >= monthlyContribution) {
        paymentStatus = 'paid';
      } else if (new Date().getDate() > 15) {
        paymentStatus = 'overdue';
      }

      return {
        monthlyContribution: monthlyContribution,
        lastPaymentDate: lastPaymentDate,
        paymentStatus: paymentStatus,
        totalPaid: totalPaid,
      };
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      return {
        monthlyContribution: 0,
        lastPaymentDate: null,
        paymentStatus: 'pending',
        totalPaid: 0,
      };
    }
  }

  // Get overview statistics for user
  async getOverviewStats(userId) {
    try {
      const totalMeals = await Meal.countDocuments({ userId });
      const totalBazarEntries = await Bazar.countDocuments({ userId });
      const totalActivities = totalMeals + totalBazarEntries;

      // Get recent activity count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMeals = await Meal.countDocuments({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      });
      const recentBazar = await Bazar.countDocuments({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      });
      const recentActivityCount = recentMeals + recentBazar;

      // Calculate performance score based on efficiency and activity
      const approvedMeals = await Meal.countDocuments({
        userId,
        status: 'approved',
      });
      const efficiency =
        totalMeals > 0 ? (approvedMeals / totalMeals) * 100 : 0;
      const activityScore = Math.min((totalActivities / 30) * 100, 100); // Normalize to 30 activities
      const performanceScore = Math.round((efficiency + activityScore) / 2);

      return {
        totalActivities: totalActivities,
        recentActivityCount: recentActivityCount,
        performanceScore: performanceScore,
      };
    } catch (error) {
      logger.error('Error getting overview stats:', error);
      return {
        totalActivities: 0,
        recentActivityCount: 0,
        performanceScore: 0,
      };
    }
  }

  // Get comprehensive user dashboard data
  async getUserDashboardData(userId) {
    try {
      const stats = await this.calculateUserStats(userId);

      // Get recent activities
      const recentActivities = await this.getRecentActivities(userId);

      // Get weekly meal data
      const weeklyMealData = await this.getWeeklyMealData(userId);

      // Get monthly bazar data
      const monthlyBazarData = await this.getMonthlyBazarData(userId);

      return {
        stats: stats,
        activities: recentActivities,
        charts: {
          weeklyMeals: weeklyMealData,
          monthlyBazar: monthlyBazarData,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting user dashboard data:', error);
      throw error;
    }
  }

  // Get recent activities for user
  async getRecentActivities(userId) {
    try {
      const activities = [];
      const limit = 10;

      // Get recent meals
      const recentMeals = await Meal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit / 2);

      // Get recent bazar entries
      const recentBazar = await Bazar.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit / 2);

      // Format meal activities
      recentMeals.forEach(meal => {
        activities.push({
          id: meal._id,
          type: 'meal',
          title:
            `${meal.breakfast ? 'Breakfast' : ''}${meal.lunch ? ' Lunch' : ''}${meal.dinner ? ' Dinner' : ''}`.trim(),
          description: `Meal submitted for ${new Date(meal.date).toLocaleDateString()}`,
          time: this.getTimeAgo(meal.createdAt),
          status: meal.status,
          icon: '🍽️',
        });
      });

      // Format bazar activities
      recentBazar.forEach(bazar => {
        activities.push({
          id: bazar._id,
          type: 'bazar',
          title: 'Bazar Entry',
          description: `Bazar entry for ৳${bazar.totalAmount}`,
          time: this.getTimeAgo(bazar.createdAt),
          status: bazar.status,
          icon: '🛒',
          amount: bazar.totalAmount,
        });
      });

      // Sort by creation time
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      return activities.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent activities:', error);
      return [];
    }
  }

  // Get weekly meal data for charts
  async getWeeklyMealData(userId) {
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

        const meals = await Meal.find({
          userId,
          date: date.toISOString().split('T')[0],
        });

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
      logger.error('Error getting weekly meal data:', error);
      return [];
    }
  }

  // Get monthly bazar data for charts
  async getMonthlyBazarData(userId) {
    try {
      const monthlyData = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < 4; i++) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });

        const startOfMonth = new Date(currentYear, currentMonth - i, 1);
        const endOfMonth = new Date(currentYear, currentMonth - i + 1, 0);

        const bazarEntries = await Bazar.find({
          userId,
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        });

        const totalAmount = bazarEntries.reduce(
          (sum, entry) => sum + entry.totalAmount,
          0
        );

        monthlyData.push({
          date: monthName,
          value: totalAmount,
        });
      }

      return monthlyData.reverse();
    } catch (error) {
      logger.error('Error getting monthly bazar data:', error);
      return [];
    }
  }

  // Helper method to get time ago
  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }
}

module.exports = new UserController();
