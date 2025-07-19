const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const User = require('../models/User');
const logger = require('../utils/logger');
const StatisticsService = require('../services/statisticsService');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class ActivityController {
  // Get comprehensive recent activities with advanced filtering
  async getRecentActivities(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      const {
        type,
        status,
        startDate,
        endDate,
        limit = 20,
        page = 1,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Build base query
      const baseQuery = {};

      // Add date range filter
      if (startDate && endDate) {
        baseQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Add search filter
      if (search) {
        baseQuery.$or = [
          { notes: { $regex: search, $options: 'i' } },
          { 'userId.name': { $regex: search, $options: 'i' } },
        ];
      }

      const activities = [];
      const limitPerType = Math.ceil(parseInt(limit) / 2);
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Helper function to get time ago
      const getTimeAgo = date => {
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
        } else if (diffInSeconds < 2592000) {
          const days = Math.floor(diffInSeconds / 86400);
          return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 31536000) {
          const months = Math.floor(diffInSeconds / 2592000);
          return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
          const years = Math.floor(diffInSeconds / 31536000);
          return `${years} year${years > 1 ? 's' : ''} ago`;
        }
      };

      // Get meals activities
      if (!type || type === 'meals') {
        const mealQuery = { ...baseQuery };
        if (!isAdmin) {
          mealQuery.userId = userId;
        }
        if (status) {
          mealQuery.status = status;
        }

        const meals = await Meal.find(mealQuery)
          .populate('userId', 'name email')
          .populate('approvedBy', 'name')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limitPerType);

        meals.forEach(meal => {
          const mealTypes = [];
          if (meal.breakfast) mealTypes.push('Breakfast');
          if (meal.lunch) mealTypes.push('Lunch');
          if (meal.dinner) mealTypes.push('Dinner');

          activities.push({
            id: meal._id.toString(),
            type: 'meal',
            title:
              mealTypes.length > 0
                ? `${mealTypes.join(', ')} Added`
                : 'Meal Entry',
            description: `${meal.userId?.name || 'Unknown'} recorded ${mealTypes.join(', ').toLowerCase()} for ${new Date(meal.date).toLocaleDateString()}`,
            time: getTimeAgo(meal.createdAt),
            priority: meal.status === 'pending' ? 'medium' : 'low',
            amount: 0,
            user: meal.userId?.name || 'Unknown',
            icon: 'restaurant',
            status: meal.status,
            date: meal.date,
            approvedBy: meal.approvedBy?.name,
            approvedAt: meal.approvedAt,
            notes: meal.notes,
            createdAt: meal.createdAt,
            updatedAt: meal.updatedAt,
          });
        });
      }

      // Get bazar activities
      if (!type || type === 'bazar') {
        const bazarQuery = { ...baseQuery };
        if (!isAdmin) {
          bazarQuery.userId = userId;
        }
        if (status) {
          bazarQuery.status = status;
        }

        const bazarEntries = await Bazar.find(bazarQuery)
          .populate('userId', 'name email')
          .populate('approvedBy', 'name')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limitPerType);

        bazarEntries.forEach(bazar => {
          activities.push({
            id: bazar._id.toString(),
            type: 'bazar',
            title: 'Bazar Entry Added',
            description: `${bazar.userId?.name || 'Unknown'} submitted bazar entry with ${bazar.items?.length || 0} items for ৳${bazar.totalAmount?.toLocaleString() || 0}`,
            time: getTimeAgo(bazar.createdAt),
            priority: bazar.status === 'pending' ? 'medium' : 'low',
            amount: bazar.totalAmount,
            user: bazar.userId?.name || 'Unknown',
            icon: 'cart',
            status: bazar.status,
            date: bazar.date,
            approvedBy: bazar.approvedBy?.name,
            approvedAt: bazar.approvedAt,
            items: bazar.items,
            totalAmount: bazar.totalAmount,
            createdAt: bazar.createdAt,
            updatedAt: bazar.updatedAt,
          });
        });
      }

      // Get user registration activities (admin only)
      if (isAdmin && (!type || type === 'members')) {
        const userQuery = { ...baseQuery };
        if (search) {
          userQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ];
        }

        const users = await User.find(userQuery)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limitPerType);

        users.forEach(user => {
          activities.push({
            id: user._id.toString(),
            type: 'member',
            title: 'New Member Joined',
            description: `${user.name} joined the mess`,
            time: getTimeAgo(user.createdAt),
            priority: 'low',
            amount: 0,
            user: user.name,
            icon: 'person',
            status: user.status || 'active',
            date: user.createdAt,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          });
        });
      }

      // Sort all activities by creation time
      activities.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });

      // Apply pagination
      const totalActivities = activities.length;
      const paginatedActivities = activities.slice(
        skip,
        skip + parseInt(limit)
      );

      // Get activity statistics using statistics service
      const statsResponse = await StatisticsService.getActivityStats();
      const stats = statsResponse.success
        ? statsResponse.data
        : {
            total: 0,
            byType: { meals: 0, bazar: 0, members: 0 },
            byStatus: { pending: 0, approved: 0, rejected: 0 },
            recent: { today: 0, week: 0, month: 0 },
          };

      return sendSuccessResponse(
        res,
        200,
        'Recent activities retrieved successfully',
        {
          activities: paginatedActivities,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalActivities,
            pages: Math.ceil(totalActivities / parseInt(limit)),
          },
          stats: stats,
        }
      );
    } catch (error) {
      logger.error('Error getting recent activities:', error);
      next(error);
    }
  }

  // Get activity statistics
  async getActivityStats(req, res, next) {
    try {
      // Get statistics from the statistics service
      const stats = await StatisticsService.getActivityStats();

      if (!stats.success) {
        logger.error('Error getting activity stats from service:', stats.error);
        return sendErrorResponse(
          res,
          500,
          stats.error || 'Failed to fetch activity statistics'
        );
      }

      return sendSuccessResponse(
        res,
        200,
        'Activity statistics retrieved successfully',
        stats.data
      );
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      return sendErrorResponse(res, 500, 'Internal server error');
    }
  }

  // Get current month meals (optimized for performance)
  async getCurrentMonthMeals(req, res, next) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      const { status, limit = 50, page = 1 } = req.query;

      // Helper function to get time ago
      const getTimeAgo = date => {
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
        } else if (diffInSeconds < 2592000) {
          const days = Math.floor(diffInSeconds / 86400);
          return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 31536000) {
          const months = Math.floor(diffInSeconds / 2592000);
          return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
          const years = Math.floor(diffInSeconds / 31536000);
          return `${years} year${years > 1 ? 's' : ''} ago`;
        }
      };

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      // Build query
      const query = {
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      };

      if (!isAdmin) {
        query.userId = userId;
      }

      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get meals with efficient population
      const meals = await Meal.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(); // Use lean() for better performance

      // Get total count
      const total = await Meal.countDocuments(query);

      // Format meals for response
      const formattedMeals = meals.map(meal => ({
        id: meal._id.toString(),
        userId: meal.userId,
        date: meal.date,
        breakfast: meal.breakfast,
        lunch: meal.lunch,
        dinner: meal.dinner,
        status: meal.status,
        notes: meal.notes,
        approvedBy: meal.approvedBy,
        approvedAt: meal.approvedAt,
        createdAt: meal.createdAt,
        updatedAt: meal.updatedAt,
        time: getTimeAgo(meal.createdAt),
      }));

      // Get monthly statistics
      const getMonthlyMealStats = async (
        userId,
        isAdmin,
        startDate,
        endDate
      ) => {
        try {
          const query = {
            date: { $gte: startDate, $lte: endDate },
          };

          if (!isAdmin) {
            query.userId = userId;
          }

          const stats = await Meal.aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                totalMeals: { $sum: 1 },
                totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
                totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
                totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
                pendingMeals: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                approvedMeals: {
                  $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                },
                rejectedMeals: {
                  $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
                },
              },
            },
          ]);

          const result = stats[0] || {
            totalMeals: 0,
            totalBreakfast: 0,
            totalLunch: 0,
            totalDinner: 0,
            pendingMeals: 0,
            approvedMeals: 0,
            rejectedMeals: 0,
          };

          return {
            ...result,
            efficiency:
              result.totalMeals > 0
                ? Math.round((result.approvedMeals / result.totalMeals) * 100)
                : 0,
            averageMealsPerDay: result.totalMeals / 30, // Assuming 30 days
          };
        } catch (error) {
          logger.error('Error getting monthly meal stats:', error);
          return {
            totalMeals: 0,
            totalBreakfast: 0,
            totalLunch: 0,
            totalDinner: 0,
            pendingMeals: 0,
            approvedMeals: 0,
            rejectedMeals: 0,
            efficiency: 0,
            averageMealsPerDay: 0,
          };
        }
      };

      const monthlyStats = await getMonthlyMealStats(
        userId,
        isAdmin,
        startOfMonth,
        endOfMonth
      );

      return sendSuccessResponse(
        res,
        200,
        'Current month meals retrieved successfully',
        {
          meals: formattedMeals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
          stats: monthlyStats,
        }
      );
    } catch (error) {
      logger.error('Error getting current month meals:', error);
      next(error);
    }
  }

  // Get monthly meal statistics
  async getMonthlyMealStats(userId, isAdmin, startDate, endDate) {
    try {
      const query = {
        date: { $gte: startDate, $lte: endDate },
      };

      if (!isAdmin) {
        query.userId = userId;
      }

      const stats = await Meal.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalMeals: { $sum: 1 },
            totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
            totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
            totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
            pendingMeals: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approvedMeals: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejectedMeals: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
          },
        },
      ]);

      const result = stats[0] || {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        pendingMeals: 0,
        approvedMeals: 0,
        rejectedMeals: 0,
      };

      return {
        ...result,
        efficiency:
          result.totalMeals > 0
            ? Math.round((result.approvedMeals / result.totalMeals) * 100)
            : 0,
        averageMealsPerDay: result.totalMeals / 30, // Assuming 30 days
      };
    } catch (error) {
      logger.error('Error getting monthly meal stats:', error);
      return {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        pendingMeals: 0,
        approvedMeals: 0,
        rejectedMeals: 0,
        efficiency: 0,
        averageMealsPerDay: 0,
      };
    }
  }

  // Helper method to get time ago
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
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }
}

module.exports = new ActivityController();
