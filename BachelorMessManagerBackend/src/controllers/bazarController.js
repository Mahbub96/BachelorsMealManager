const Bazar = require('../models/Bazar');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

class BazarController {
  // Submit bazar entry
  async submitBazar(req, res, next) {
    try {
      const { items, totalAmount, description, date } = req.body;
      const userId = req.user.id;
      const receiptImage = req.file ? req.file.path : null;

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendErrorResponse(res, 400, 'Items array is required');
      }

      // Validate total amount
      if (!totalAmount || totalAmount <= 0) {
        return sendErrorResponse(res, 400, 'Valid total amount is required');
      }

      // Check business rules
      if (totalAmount > config.business.maxBazarAmount) {
        return sendErrorResponse(res, 400, `Bazar amount exceeds maximum limit of ${config.business.maxBazarAmount}`);
      }

      // Create bazar entry
      const bazar = await Bazar.create({
        userId,
        items,
        totalAmount,
        description,
        date: new Date(date),
        receiptImage,
        status: config.business.autoApproveBazar ? 'approved' : 'pending'
      });

      // Populate user information
      await bazar.populate('userId', 'name email');

      logger.info(`Bazar entry submitted by user ${req.user.email} for amount ${totalAmount}`);

      return sendSuccessResponse(res, 201, 'Bazar entry submitted successfully', bazar);
    } catch (error) {
      next(error);
    }
  }

  // Get user bazar entries
  async getUserBazar(req, res, next) {
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
      
      // Get bazar entries with pagination
      const bazarEntries = await Bazar.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Bazar.countDocuments(query);

      return sendSuccessResponse(res, 200, 'User bazar entries retrieved successfully', {
        bazarEntries,
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

  // Get all bazar entries (admin only)
  async getAllBazar(req, res, next) {
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
      
      // Get bazar entries with pagination
      const bazarEntries = await Bazar.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Bazar.countDocuments(query);

      return sendSuccessResponse(res, 200, 'All bazar entries retrieved successfully', {
        bazarEntries,
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

  // Update bazar status (admin only)
  async updateBazarStatus(req, res, next) {
    try {
      const { bazarId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      // Update bazar status
      bazar.status = status;
      bazar.notes = notes || bazar.notes;
      bazar.approvedBy = adminId;
      bazar.approvedAt = new Date();

      await bazar.save();

      // Populate user information
      await bazar.populate('userId', 'name email');
      await bazar.populate('approvedBy', 'name');

      logger.info(`Bazar status updated by admin ${req.user.email} to ${status}`);

      return sendSuccessResponse(res, 200, 'Bazar status updated successfully', bazar);
    } catch (error) {
      next(error);
    }
  }

  // Get bazar statistics
  async getBazarStats(req, res, next) {
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
      const stats = await Bazar.getStats(query);

      return sendSuccessResponse(res, 200, 'Bazar statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  // Get user bazar statistics
  async getUserBazarStats(req, res, next) {
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
      const stats = await Bazar.getUserStats(userId, query);

      return sendSuccessResponse(res, 200, 'User bazar statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  // Delete bazar entry
  async deleteBazar(req, res, next) {
    try {
      const { bazarId } = req.params;
      const userId = req.user.id;

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      // Check if user can delete this bazar (own entry or admin)
      if (bazar.userId.toString() !== userId && req.user.role !== 'admin') {
        return sendErrorResponse(res, 403, 'Access denied');
      }

      await Bazar.findByIdAndDelete(bazarId);

      logger.info(`Bazar entry deleted by user ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Bazar entry deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update bazar entry
  async updateBazar(req, res, next) {
    try {
      const { bazarId } = req.params;
      const { items, totalAmount, description } = req.body;
      const userId = req.user.id;

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      // Check if user can update this bazar (own entry or admin)
      if (bazar.userId.toString() !== userId && req.user.role !== 'admin') {
        return sendErrorResponse(res, 403, 'Access denied');
      }

      // Only allow updates if bazar is pending
      if (bazar.status !== 'pending' && req.user.role !== 'admin') {
        return sendErrorResponse(res, 400, 'Cannot update approved or rejected bazar entries');
      }

      // Update bazar
      const updateData = {};
      if (items) updateData.items = items;
      if (totalAmount) updateData.totalAmount = totalAmount;
      if (description !== undefined) updateData.description = description;

      const updatedBazar = await Bazar.findByIdAndUpdate(
        bazarId,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      logger.info(`Bazar entry updated by user ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Bazar entry updated successfully', updatedBazar);
    } catch (error) {
      next(error);
    }
  }

  // Get bazar by ID
  async getBazarById(req, res, next) {
    try {
      const { bazarId } = req.params;

      const bazar = await Bazar.findById(bazarId)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name');

      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      return sendSuccessResponse(res, 200, 'Bazar entry retrieved successfully', bazar);
    } catch (error) {
      next(error);
    }
  }

  // Bulk approve bazar entries (admin only)
  async bulkApproveBazar(req, res, next) {
    try {
      const { bazarIds, status, notes } = req.body;
      const adminId = req.user.id;

      if (!bazarIds || !Array.isArray(bazarIds) || bazarIds.length === 0) {
        return sendErrorResponse(res, 400, 'Bazar IDs array is required');
      }

      // Update multiple bazar entries
      const result = await Bazar.updateMany(
        { _id: { $in: bazarIds } },
        {
          status,
          notes: notes || 'Bulk updated',
          approvedBy: adminId,
          approvedAt: new Date()
        }
      );

      logger.info(`Bulk bazar status update by admin ${req.user.email}: ${result.modifiedCount} entries updated`);

      return sendSuccessResponse(res, 200, 'Bulk bazar status update successful', {
        updatedCount: result.modifiedCount,
        totalRequested: bazarIds.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get bazar summary by category
  async getBazarSummaryByCategory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Build query
      const query = {};
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get summary by category
      const summary = await Bazar.getSummaryByCategory(query);

      return sendSuccessResponse(res, 200, 'Bazar summary by category retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  }

  // Get bazar trends
  async getBazarTrends(req, res, next) {
    try {
      const { period = 'month' } = req.query;

      // Get trends
      const trends = await Bazar.getTrends(period);

      return sendSuccessResponse(res, 200, 'Bazar trends retrieved successfully', trends);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BazarController(); 