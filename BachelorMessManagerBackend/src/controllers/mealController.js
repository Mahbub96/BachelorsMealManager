const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const StatisticsService = require('../services/statisticsService');
const { getGroupMemberIds } = require('../utils/groupHelper');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class MealController {

  // Submit daily meals
  async submitMeals(req, res, next) {
    try {
      const { breakfast, lunch, dinner, date, notes } = req.body;
      // Use _id to ensure we get the ObjectId, not the string id
      // Convert to ObjectId if it's a string to ensure proper matching
      // SECURITY: Always use authenticated user's ID from token, never from request body
      let userId = req.user._id || req.user.id;
      if (typeof userId === 'string') {
        userId = new mongoose.Types.ObjectId(userId);
      }

      // Enhanced validation
      if (!date) {
        return sendErrorResponse(res, 400, 'Date is required');
      }

      // Validate date format and ensure it's not in the future
      const mealDate = new Date(date);

      if (isNaN(mealDate.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid date format');
      }

      // Check if at least one meal is selected
      if (!breakfast && !lunch && !dinner) {
        return sendErrorResponse(res, 400, 'Please select at least one meal');
      }

      // Check if meal entry already exists for THIS USER and this date
      // Normalize date to start of day in UTC to match how dates are stored
      // Create start and end of day dates (without mutating mealDate)
      const startOfDay = new Date(mealDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(mealDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // IMPORTANT: Check for THIS SPECIFIC USER's meal entry for this date
      // Different users CAN have meals for the same date - only prevent duplicate for same user

      const query = {
        userId: userId, // Only check for this specific user
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      const existingMeal = await Meal.findOne(query);

      if (existingMeal) {
        // Verify the existing meal belongs to this user (safety check)
        const existingUserId = existingMeal.userId ? existingMeal.userId.toString() : 'null';
        const currentUserId = userId.toString();
        if (existingUserId !== currentUserId) {
          // If somehow we found a meal for a different user, continue (shouldn't happen)
          // This indicates a bug in the query or data
        } else {
          // This user already has a meal entry for this date - CORRECT BEHAVIOR
          logger.info(`User ${req.user.email} attempted duplicate meal submission for ${new Date(mealDate).toLocaleDateString()}`);
          return sendErrorResponse(
            res,
            400,
            `You already have a meal entry for ${new Date(mealDate).toLocaleDateString()}. Use PUT /api/meals/${existingMeal._id} to update your existing entry. Each user can only create or update their meal once per day.`,
            {
              existingMealId: existingMeal._id,
              existingMealStatus: existingMeal.status,
              existingMeals: {
                breakfast: existingMeal.breakfast,
                lunch: existingMeal.lunch,
                dinner: existingMeal.dinner,
              },
              updateEndpoint: `/api/meals/${existingMeal._id}`,
            },
          );
        }
      }

      // Create meal entry with enhanced data
      // Normalize date to start of day in UTC for consistent storage
      const normalizedDate = new Date(mealDate);
      normalizedDate.setUTCHours(0, 0, 0, 0);

      let meal;
      try {
        meal = await Meal.create({
          userId,
          breakfast: breakfast || false,
          lunch: lunch || false,
          dinner: dinner || false,
          date: normalizedDate,
          notes: notes?.trim() || '',
          status: config.business?.autoApproveMeals ? 'approved' : 'pending',
        });
      } catch (createError) {
        // Handle duplicate key error (E11000) as a fallback
        // This catches race conditions or if the query above missed something
        if (createError.code === 11000) {
          // Try to find the existing meal to provide better error message
          // IMPORTANT: Only check for THIS SPECIFIC USER's meal
          const duplicateMeal = await Meal.findOne({
            userId: userId, // Only check for this specific user
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          });

          if (duplicateMeal) {
            return sendErrorResponse(
              res,
              400,
              `Meal entry already exists for ${new Date(mealDate).toLocaleDateString()}. You can update your existing entry instead.`,
              {
                existingMealId: duplicateMeal._id,
                existingMealStatus: duplicateMeal.status,
                existingMeals: {
                  breakfast: duplicateMeal.breakfast,
                  lunch: duplicateMeal.lunch,
                  dinner: duplicateMeal.dinner,
                },
              }
            );
          }
        }
        // Re-throw if it's not a duplicate key error
        throw createError;
      }

      // Populate user information
      await meal.populate('userId', 'name email');

      // Log the action
      logger.info(`Meal submitted by user ${req.user.email} for date ${date}`, {
        userId: req.user.id,
        mealId: meal._id,
        meals: { breakfast, lunch, dinner },
        status: meal.status,
      });

      // Update statistics after meal submission
      await StatisticsService.updateAfterOperation('meal_submitted', {
        mealId: meal._id,
        userId: req.user.id,
        meals: { breakfast, lunch, dinner },
        status: meal.status,
      });

      return sendSuccessResponse(
        res,
        201,
        'Meals submitted successfully',
        meal
      );
    } catch (error) {
      logger.error('Error submitting meal:', error);
      next(error);
    }
  }

  // Get user meals (group-scoped for admin/member: returns all group members' meals) <- GET /api/meals
  async getUserMeals(req, res, next) {
    try {
      let userId = req.user._id || req.user.id;

      if (typeof userId === 'string') {
        userId = new mongoose.Types.ObjectId(userId);
      }
      const { startDate, endDate, status, limit = 10, page = 1 } = req.query;

      const groupMemberIds = await getGroupMemberIds(req.user);
      const useGroup = Array.isArray(groupMemberIds) && groupMemberIds.length > 0;

      const query = useGroup
        ? { userId: { $in: groupMemberIds } }
        : { userId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const meals = await Meal.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Meal.countDocuments(query);

      return sendSuccessResponse(
        res,
        200,
        useGroup ? 'Group meals retrieved successfully' : 'User meals retrieved successfully',
        {
          meals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        }
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all meals (admin/member: group-scoped; super_admin: all). Defaults to current month when no date params.
  async getAllMeals(req, res, next) {
    try {
      const {
        status,
        startDate,
        endDate,
        userId,
        limit = 20,
        page = 1,
      } = req.query;

      const query = {};
      if (status) query.status = status;

      // Date: use params if both provided, else default to current month
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.date = { $gte: monthStart, $lte: monthEnd };
      }

      if (userId) {
        query.userId = userId;
      } else {
        const groupMemberIds = await getGroupMemberIds(req.user);
        if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
          query.userId = { $in: groupMemberIds };
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const meals = await Meal.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Meal.countDocuments(query);

      return sendSuccessResponse(res, 200, 'Meals retrieved successfully', {
        meals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update meal status (admin only)
  async updateMealStatus(req, res, next) {
    try {
      const { mealId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        return sendErrorResponse(res, 404, 'Meal entry not found');
      }

      // Update meal status
      meal.status = status;
      meal.notes = notes || meal.notes;
      meal.approvedBy = adminId;
      meal.approvedAt = new Date();

      await meal.save();

      // Populate user information
      await meal.populate('userId', 'name email');
      await meal.populate('approvedBy', 'name');

      logger.info(
        `Meal status updated by admin ${req.user.email} to ${status}`
      );

      // Update statistics after meal status update
      await StatisticsService.updateAfterOperation('meal_status_updated', {
        mealId: meal._id,
        adminId: req.user.id,
        oldStatus: meal.status,
        newStatus: status,
      });

      return sendSuccessResponse(
        res,
        200,
        'Meal status updated successfully',
        meal
      );
    } catch (error) {
      next(error);
    }
  }

  // Get meal statistics
  async getMealStats(req, res, next) {
    try {
      const { forceUpdate = false } = req.query;

      // Get statistics from the statistics service
      const stats = await StatisticsService.getMealStats();

      return sendSuccessResponse(
        res,
        200,
        'Meal statistics retrieved successfully',
        stats.data
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user meal statistics
  async getUserMealStats(req, res, next) {
    try {
      // Convert userId to ObjectId for proper matching
      let userId = req.user._id || req.user.id;
      if (typeof userId === 'string') {
        userId = new mongoose.Types.ObjectId(userId);
      }
      const { startDate, endDate } = req.query;

      // Build filters for Meal.getStats
      // If no date range provided, default to current month (1st to today)
      let filters = { userId: userId };

      if (startDate && endDate) {
        filters.startDate = new Date(startDate);
        filters.endDate = new Date(endDate);
      } else {
        // Default to current month: from 1st of current month to current date
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const todayEndOfDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          23,
          59,
          59,
          999,
        );
        filters.startDate = firstDayOfMonth;
        filters.endDate = todayEndOfDay;
      }

      // Get user statistics using the existing getStats method
      const stats = await Meal.getStats(filters);

      return sendSuccessResponse(
        res,
        200,
        'User meal statistics retrieved successfully',
        stats,
      );
    } catch (error) {
      logger.error('Error in getUserMealStats:', error);
      next(error);
    }
  }

  // Delete meal entry
  async deleteMeal(req, res, next) {
    try {
      const { mealId } = req.params;
      const userId = req.user.id;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        return sendErrorResponse(res, 404, 'Meal entry not found');
      }

      // Check if user can delete this meal (own meal or admin)
      if (meal.userId.toString() !== userId && req.user.role !== 'admin') {
        return sendErrorResponse(res, 403, 'Access denied');
      }

      await Meal.findByIdAndDelete(mealId);

      logger.info(`Meal deleted by user ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Meal entry deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update meal entry
  async updateMeal(req, res, next) {
    try {
      const { mealId } = req.params;
      const { breakfast, lunch, dinner, notes } = req.body;
      const userId = req.user.id;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        return sendErrorResponse(res, 404, 'Meal entry not found');
      }

      // Check if user can update this meal (own meal or admin)
      if (meal.userId.toString() !== userId && req.user.role !== 'admin') {
        return sendErrorResponse(res, 403, 'Access denied');
      }

      // Only allow updates if meal is pending (unless admin)
      if (meal.status !== 'pending' && req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          400,
          'Cannot update approved or rejected meals'
        );
      }

      // Prevent multiple updates per day: check if meal was already updated
      // Each user can only update their meal once per day
      if (req.user.role !== 'admin') {
        const mealDate = new Date(meal.date);
        const createdAt = new Date(meal.createdAt);
        const updatedAt = new Date(meal.updatedAt);

        // Normalize dates to start of day for comparison
        const mealDateNormalized = new Date(mealDate);
        mealDateNormalized.setUTCHours(0, 0, 0, 0);
        const updatedAtNormalized = new Date(updatedAt);
        updatedAtNormalized.setUTCHours(0, 0, 0, 0);

        // Check if updatedAt is significantly different from createdAt (more than 2 seconds)
        // This indicates the meal was already updated (not just created)
        const timeDiff = Math.abs(updatedAt.getTime() - createdAt.getTime());
        const wasUpdated = timeDiff > 2000; // 2 second buffer for save operations

        // If meal was updated and the update happened on the same day as the meal date,
        // prevent further updates for that day
        if (wasUpdated && updatedAtNormalized.getTime() === mealDateNormalized.getTime()) {
          return sendErrorResponse(
            res,
            400,
            `You have already updated your meal for ${new Date(mealDate).toLocaleDateString()}. Each user can only update their meal once per day.`,
          );
        }
      }

      // Update meal
      const updateData = {};
      if (breakfast !== undefined) updateData.breakfast = breakfast;
      if (lunch !== undefined) updateData.lunch = lunch;
      if (dinner !== undefined) updateData.dinner = dinner;
      if (notes !== undefined) updateData.notes = notes;

      const updatedMeal = await Meal.findByIdAndUpdate(mealId, updateData, {
        new: true,
        runValidators: true,
      }).populate('userId', 'name email');

      logger.info(`Meal updated by user ${req.user.email}`);

      return sendSuccessResponse(
        res,
        200,
        'Meal updated successfully',
        updatedMeal,
      );
    } catch (error) {
      next(error);
    }
  }

  // Get meal by ID
  async getMealById(req, res, next) {
    try {
      const { mealId } = req.params;

      const meal = await Meal.findById(mealId)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name');

      if (!meal) {
        return sendErrorResponse(res, 404, 'Meal entry not found');
      }

      return sendSuccessResponse(res, 200, 'Meal retrieved successfully', meal);
    } catch (error) {
      next(error);
    }
  }

  // Bulk approve meals (admin only)
  async bulkApproveMeals(req, res, next) {
    try {
      const { mealIds, status, notes } = req.body;
      const adminId = req.user.id;

      if (!mealIds || !Array.isArray(mealIds) || mealIds.length === 0) {
        return sendErrorResponse(res, 400, 'Meal IDs array is required');
      }

      // Update multiple meals
      const result = await Meal.updateMany(
        { _id: { $in: mealIds } },
        {
          status,
          notes: notes || 'Bulk updated',
          approvedBy: adminId,
          approvedAt: new Date(),
        }
      );

      logger.info(
        `Bulk meal status update by admin ${req.user.email}: ${result.modifiedCount} meals updated`
      );

      return sendSuccessResponse(
        res,
        200,
        'Bulk meal status update successful',
        {
          updatedCount: result.modifiedCount,
          totalRequested: mealIds.length,
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MealController();
