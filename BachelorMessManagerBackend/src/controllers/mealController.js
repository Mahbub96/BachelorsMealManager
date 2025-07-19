const Meal = require('../models/Meal');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

class MealController {
  // Submit daily meals
  async submitMeals(req, res, next) {
    try {
      const { breakfast, lunch, dinner, date, notes } = req.body;
      const userId = req.user.id;

      // Check if meal entry already exists for this date
      const existingMeal = await Meal.findOne({
        userId,
        date: new Date(date)
      });

      if (existingMeal) {
        return sendErrorResponse(res, 400, 'Meal entry already exists for this date');
      }

      // Create meal entry
      const meal = await Meal.create({
        userId,
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        date: new Date(date),
        notes,
        status: config.business.autoApproveMeals ? 'approved' : 'pending'
      });

      // Populate user information
      await meal.populate('userId', 'name email');

      logger.info(`Meal submitted by user ${req.user.email} for date ${date}`);

      return sendSuccessResponse(res, 201, 'Meals submitted successfully', meal);
    } catch (error) {
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
          $lte: new Date(endDate)
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

      return sendSuccessResponse(res, 200, 'User meals retrieved successfully', {
        meals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all meals (admin only)
  async getAllMeals(req, res, next) {
    try {
      const { status, startDate, endDate, userId, limit = 20, page = 1 } = req.query;

      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
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
          pages: Math.ceil(total / parseInt(limit))
        }
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

      logger.info(`Meal status updated by admin ${req.user.email} to ${status}`);

      return sendSuccessResponse(res, 200, 'Meal status updated successfully', meal);
    } catch (error) {
      next(error);
    }
  }

  // Get meal statistics
  async getMealStats(req, res, next) {
    try {
      const { startDate, endDate, userId } = req.query;

      // Build query
      const query = {};
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      if (userId) {
        query.userId = userId;
      }

      // Get statistics
      const stats = await Meal.getStats(query);

      return sendSuccessResponse(res, 200, 'Meal statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  // Get user meal statistics
  async getUserMealStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Build query
      const query = { userId };
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get user statistics
      const stats = await Meal.getUserStats(userId, query);

      return sendSuccessResponse(res, 200, 'User meal statistics retrieved successfully', stats);
    } catch (error) {
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
        return sendErrorResponse(res, 400, 'Cannot update approved or rejected meals');
      }

      // Update meal
      const updateData = {};
      if (breakfast !== undefined) updateData.breakfast = breakfast;
      if (lunch !== undefined) updateData.lunch = lunch;
      if (dinner !== undefined) updateData.dinner = dinner;
      if (notes !== undefined) updateData.notes = notes;

      const updatedMeal = await Meal.findByIdAndUpdate(
        mealId,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      logger.info(`Meal updated by user ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Meal updated successfully', updatedMeal);
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
          approvedAt: new Date()
        }
      );

      logger.info(`Bulk meal status update by admin ${req.user.email}: ${result.modifiedCount} meals updated`);

      return sendSuccessResponse(res, 200, 'Bulk meal status update successful', {
        updatedCount: result.modifiedCount,
        totalRequested: mealIds.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MealController(); 