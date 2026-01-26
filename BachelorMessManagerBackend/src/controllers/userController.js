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

  // Get meal statistics for user (current month to current day)
  async getMealStats(userId) {
    try {
      // Get start of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // All meal queries only within this month
      const baseQuery = {
        userId,
        date: { $gte: firstDayOfMonth, $lte: today }
      };


      const allMeals = await Meal.find(baseQuery);

      const mealSummary = {
        lunchCount: 0,
        dinnerCount: 0,
        breakfastCount: 0,
        totalCount: function () {
          return this.lunchCount + this.dinnerCount + this.breakfastCount;
        }
      };


      allMeals.forEach(meal => {

        if (meal.lunch) mealSummary.lunchCount++;
        if (meal.dinner) mealSummary.dinnerCount++;
        if (meal.breakfast) mealSummary.breakfastCount++;
      });

      const totalMeals = mealSummary.totalCount();

      const approvedMeals = await Meal.countDocuments({
        ...baseQuery,
        status: 'approved',
      });
      const pendingMeals = await Meal.countDocuments({
        ...baseQuery,
        status: 'pending',
      });
      const rejectedMeals = await Meal.countDocuments({
        ...baseQuery,
        status: 'rejected',
      });

      // Calculate efficiency percentage
      const efficiency =
        totalMeals > 0 ? Math.round((approvedMeals / totalMeals) * 100) : 0;

      // Calculate average meals per day (in current month up to today)
      const currentDay = now.getDate(); // e.g., 1-31
      const averagePerDay =
        currentDay > 0 ? (totalMeals / currentDay).toFixed(1) : 0;

      // Get days since last meal (relative to this month)
      const lastMeal = await Meal.findOne(baseQuery).sort({ date: -1 });
      const daysSinceLastMeal = lastMeal
        ? Math.ceil(
          (now - new Date(lastMeal.date)) / (1000 * 60 * 60 * 24)
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

  // Get All meal statistics for user
  async getAllMealsStats(userId) {
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

  // Get bazar statistics for user for current month up to current date
  async getBazarStats(userId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Find bazar entries for this user, from start of month to now
      const bazarEntries = await Bazar.find({
        userId,
        createdAt: {
          $gte: startOfMonth,
          $lte: now,
        },
      });

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

  // Get bazar statistics for user
  async getAllBazarStats(userId) {
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

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const user = await User.findById(userId);

      // Get last bazar entry date as proxy for last payment
      const lastBazarEntry = await Bazar.findOne({ userId, createdAt: { $gte: firstDayOfMonth, $lte: today } }).sort({
        createdAt: -1,
      });
      const lastPaymentDate = lastBazarEntry
        ? lastBazarEntry.createdAt.toISOString().split('T')[0]
        : null;

      // Calculate payment status based on bazar entries
      const bazarEntries = await Bazar.find({ userId, createdAt: { $gte: firstDayOfMonth, $lte: today } });
      const totalPaid = bazarEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + entry.totalAmount, 0);

      let paymentStatus = 'pending';
      const monthlyContribution = user.monthlyContribution;
      if (totalPaid >= monthlyContribution) {
        paymentStatus = 'paid';
      } else if (now.getDate() > 15) {
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

  // Get All payment statistics for user
  async getAllPaymentStats(userId) {
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

  // Create user (for admins)
  async createUser(req, res, next) {
    try {
      const { name, email, password, phone, role = 'member' } = req.body;
      const currentUser = req.user;

      // Only admins and super admins can create users
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
      }

      // Admins can only create members, super admins can create any role
      if (currentUser.role === 'admin' && role !== 'member') {
        return sendErrorResponse(res, 403, 'Admins can only create members.');
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return sendErrorResponse(res, 400, 'User with this email already exists');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role,
        createdBy: currentUser._id, // Track which admin created this user
      });

      logger.info(`User created by ${currentUser.email}: ${user.email}`);

      const userResponse = await User.findById(user._id).select('-password');

      return sendSuccessResponse(
        res,
        201,
        'User created successfully',
        userResponse
      );
    } catch (error) {
      logger.error('Error in createUser:', error);
      next(error);
    }
  }

  // Get all users (for admins)
  async getAllUsers(req, res, next) {
    try {
      const currentUser = req.user;
      const { role, status, search, page = 1, limit = 20 } = req.query;

      // Only admins and super admins can list users
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
      }

      // Build query
      let query = {};

      // Local admins can only see users they created, super admins can see all
      if (currentUser.role === 'admin') {
        query.createdBy = currentUser._id;
      }
      // Super admin can see all users (no createdBy filter)

      // Apply filters
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get users and total count
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query),
      ]);

      return sendSuccessResponse(
        res,
        200,
        'Users retrieved successfully',
        {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        }
      );
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      next(error);
    }
  }

  // Update user (for admins)
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, phone, role, status } = req.body;
      const currentUser = req.user;

      // Only admins and super admins can update users
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
      }

      // Find the user to update
      const user = await User.findById(id);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Admins can only update users they created, super admins can update any user
      if (currentUser.role === 'admin' && user.createdBy?.toString() !== currentUser._id.toString()) {
        return sendErrorResponse(res, 403, 'You can only update users you created.');
      }

      // Admins can only change role to member, super admins can change to any role
      if (role && currentUser.role === 'admin' && role !== 'member') {
        return sendErrorResponse(res, 403, 'Admins can only set role to member.');
      }

      // Prevent updating email to an existing email
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser._id.toString() !== id) {
          return sendErrorResponse(res, 400, 'User with this email already exists');
        }
      }

      // Update fields
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (role !== undefined) user.role = role;
      if (status !== undefined) user.status = status;

      await user.save();

      const updatedUser = await User.findById(id).select('-password');

      return sendSuccessResponse(
        res,
        200,
        'User updated successfully',
        updatedUser
      );
    } catch (error) {
      logger.error('Error in updateUser:', error);
      next(error);
    }
  }

  // Delete user (for admins)
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Only admins and super admins can delete users
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
      }

      // Prevent self-deletion
      if (id === currentUser.id) {
        return sendErrorResponse(res, 400, 'You cannot delete your own account');
      }

      // Find the user to delete
      const user = await User.findById(id);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Admins can only delete users they created, super admins can delete any user
      if (currentUser.role === 'admin' && user.createdBy?.toString() !== currentUser._id.toString()) {
        return sendErrorResponse(res, 403, 'You can only delete users you created.');
      }

      // Delete the user
      await User.findByIdAndDelete(id);

      return sendSuccessResponse(
        res,
        200,
        'User deleted successfully',
        { id }
      );
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      next(error);
    }
  }

  // Reset user password (for admins)
  async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const currentUser = req.user;

      // Only admins and super admins can reset passwords (redundant check for defense in depth)
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
      }

      // Validate new password
      if (!newPassword || typeof newPassword !== 'string') {
        return sendErrorResponse(res, 400, 'New password is required and must be a string');
      }

      if (newPassword.length < 6) {
        return sendErrorResponse(res, 400, 'Password must be at least 6 characters long');
      }

      if (newPassword.length > 128) {
        return sendErrorResponse(res, 400, 'Password must be less than 128 characters');
      }

      // Find the user
      const user = await User.findById(id).select('+password');
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Prevent resetting password for inactive users (they should be activated first)
      if (user.status !== 'active') {
        return sendErrorResponse(res, 400, 'Cannot reset password for inactive users. Please activate the user first.');
      }

      // Prevent self-password reset (admins should use regular password change)
      const currentUserId = currentUser._id ? currentUser._id.toString() : currentUser.id;
      if (id === currentUserId) {
        return sendErrorResponse(res, 400, 'You cannot reset your own password using this endpoint. Use the profile settings instead.');
      }

      // Admins can only reset passwords for users they created, super admins can reset any user
      if (currentUser.role === 'admin' && user.createdBy?.toString() !== currentUser._id.toString()) {
        return sendErrorResponse(res, 403, 'You can only reset passwords for users you created.');
      }

      // Prevent resetting password for super_admin users (only super admins can reset super admin passwords)
      if (user.role === 'super_admin' && currentUser.role !== 'super_admin') {
        return sendErrorResponse(res, 403, 'Only super admins can reset passwords for super admin users.');
      }

      // Set new password (will be hashed by pre-save middleware)
      user.password = newPassword;
      // Clear any existing password reset tokens
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      // passwordChangedAt will be set automatically by pre-save middleware
      await user.save();

      logger.info(`Password reset by admin ${currentUser.email} (${currentUser.role}) for user: ${user.email} (${user.role})`);

      return sendSuccessResponse(
        res,
        200,
        'Password reset successfully',
        { id: user._id, email: user.email }
      );
    } catch (error) {
      logger.error('Error in resetUserPassword:', error);
      next(error);
    }
  }
}

module.exports = new UserController();
