const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const StatisticsService = require('../services/statisticsService');
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
      let userId = req.user._id || req.user.id;
      if (typeof userId === 'string') {
        userId = new mongoose.Types.ObjectId(userId);
      }

      console.log('🍽️ Meal submission request:', {
        body: req.body,
        userEmail: req.user.email,
        userId: userId,
        userIdType: typeof userId,
        userIdString: userId.toString(),
      });

      // Enhanced validation
      if (!date) {
        return sendErrorResponse(res, 400, 'Date is required');
      }

      // Validate date format and ensure it's not in the future
      const mealDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (isNaN(mealDate.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid date format');
      }

      if (mealDate > today) {
        return sendErrorResponse(
          res,
          400,
          'Cannot submit meals for future dates'
        );
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
      
      // Debug logging to verify query is correct
      logger.debug('Checking for existing meal', {
        queryUserId: userId.toString(),
        queryUserIdType: userId.constructor.name,
        queryDateRange: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        },
        userEmail: req.user.email,
      });
      
      const existingMeal = await Meal.findOne(query);

      if (existingMeal) {
        // Verify the existing meal belongs to this user (safety check)
        const existingUserId = existingMeal.userId ? existingMeal.userId.toString() : 'null';
        const currentUserId = userId.toString();
        
        logger.debug('Found existing meal', {
          existingMealId: existingMeal._id,
          existingMealUserId: existingUserId,
          currentUserId: currentUserId,
          existingMealDate: existingMeal.date,
          queryDate: mealDate,
          userIdsMatch: existingUserId === currentUserId,
        });
        
        if (existingUserId !== currentUserId) {
          logger.warn('Meal duplicate check found meal for different user - this should not happen!', {
            requestedUserId: currentUserId,
            foundMealUserId: existingUserId,
            requestedUserEmail: req.user.email,
            existingMealId: existingMeal._id,
          });
          // If somehow we found a meal for a different user, continue (shouldn't happen)
          // This indicates a bug in the query or data
        } else {
          // This user already has a meal entry for this date - CORRECT BEHAVIOR
          logger.info(`User ${req.user.email} (${currentUserId}) attempted duplicate meal submission for ${new Date(mealDate).toLocaleDateString()}`);
          return sendErrorResponse(
            res,
            400,
            `You already have a meal entry for ${new Date(mealDate).toLocaleDateString()}. You can update your existing entry instead.`,
            {
              existingMealId: existingMeal._id,
              existingMealStatus: existingMeal.status,
              existingMeals: {
                breakfast: existingMeal.breakfast,
                lunch: existingMeal.lunch,
                dinner: existingMeal.dinner,
              },
            }
          );
        }
      } else {
        logger.debug('No existing meal found for this user and date - proceeding with creation', {
          userId: userId.toString(),
          userEmail: req.user.email,
          date: mealDate,
        });
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

  // Get user meals
  async getUserMeals(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, status, limit = 10, page = 1 } = req.query;

      // Build query
      const query = { userId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get meals with pagination
      const meals = await Meal.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Meal.countDocuments(query);

      return sendSuccessResponse(
        res,
        200,
        'User meals retrieved successfully',
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

  // Get all meals (admin only)
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

      // Build query
      const query = {};

      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (userId) {
        query.userId = userId;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get meals with pagination
      const meals = await Meal.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Meal.countDocuments(query);

      return sendSuccessResponse(res, 200, 'All meals retrieved successfully', {
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
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      console.log('🍽️ getUserMealStats called with userId:', userId);

      // Build query
      const query = { userId: userId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      console.log('🔍 Query:', query);

      // Get user statistics using the existing getStats method
      const stats = await Meal.getStats(query);

      console.log('📊 Stats result:', stats);

      return sendSuccessResponse(
        res,
        200,
        'User meal statistics retrieved successfully',
        stats
      );
    } catch (error) {
      console.error('❌ Error in getUserMealStats:', error);
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

      // Only allow updates if meal is pending
      if (meal.status !== 'pending' && req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          400,
          'Cannot update approved or rejected meals'
        );
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
        updatedMeal
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
