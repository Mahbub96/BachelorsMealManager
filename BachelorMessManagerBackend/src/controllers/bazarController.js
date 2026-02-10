const Bazar = require('../models/Bazar');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { getGroupMemberIds } = require('../utils/groupHelper');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

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
        return sendErrorResponse(
          res,
          400,
          `Bazar amount exceeds maximum limit of ${config.business.maxBazarAmount}`
        );
      }

      // Create bazar entry
      const bazar = await Bazar.create({
        userId,
        items,
        totalAmount,
        description,
        date: new Date(date),
        receiptImage,
        status: config.business.autoApproveBazar ? 'approved' : 'pending',
      });

      // Populate user information
      await bazar.populate('userId', 'name email');

      logger.info(
        `Bazar entry submitted by user ${req.user.email} for amount ${totalAmount}`
      );

      return sendSuccessResponse(
        res,
        201,
        'Bazar entry submitted successfully',
        bazar
      );
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
          $lte: new Date(endDate),
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

      return sendSuccessResponse(
        res,
        200,
        'User bazar entries retrieved successfully',
        {
          bazarEntries,
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

  // Get all bazar entries (admin/member: group-scoped; super_admin: all). Defaults to current month when no date params.
  async getAllBazar(req, res, next) {
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

      // User scope: specific userId from params, or group members (admin/member see group; super_admin sees all)
      if (userId) {
        query.userId = userId;
      } else {
        const groupMemberIds = await getGroupMemberIds(req.user);
        if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
          query.userId = { $in: groupMemberIds };
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const bazarEntries = await Bazar.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Bazar.countDocuments(query);

      return sendSuccessResponse(
        res,
        200,
        'All bazar entries retrieved successfully',
        {
          bazarEntries,
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

      logger.info(
        `Bazar status updated by admin ${req.user.email} to ${status}`
      );

      return sendSuccessResponse(
        res,
        200,
        'Bazar status updated successfully',
        bazar
      );
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
          $lte: new Date(endDate),
        };
      }

      if (userId) {
        query.userId = userId;
      }

      // Get statistics
      const stats = await Bazar.getStats(query);

      return sendSuccessResponse(
        res,
        200,
        'Bazar statistics retrieved successfully',
        stats
      );
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
          $lte: new Date(endDate),
        };
      }

      // Get user statistics
      const stats = await Bazar.getUserStats(userId, query);

      return sendSuccessResponse(
        res,
        200,
        'User bazar statistics retrieved successfully',
        stats
      );
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
        return sendErrorResponse(
          res,
          400,
          'Cannot update approved or rejected bazar entries'
        );
      }

      // Update bazar
      const updateData = {};
      if (items) updateData.items = items;
      if (totalAmount) updateData.totalAmount = totalAmount;
      if (description !== undefined) updateData.description = description;

      const updatedBazar = await Bazar.findByIdAndUpdate(bazarId, updateData, {
        new: true,
        runValidators: true,
      }).populate('userId', 'name email');

      logger.info(`Bazar entry updated by user ${req.user.email}`);

      return sendSuccessResponse(
        res,
        200,
        'Bazar entry updated successfully',
        updatedBazar
      );
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

      return sendSuccessResponse(
        res,
        200,
        'Bazar entry retrieved successfully',
        bazar
      );
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
          approvedAt: new Date(),
        }
      );

      logger.info(
        `Bulk bazar status update by admin ${req.user.email}: ${result.modifiedCount} entries updated`
      );

      return sendSuccessResponse(
        res,
        200,
        'Bulk bazar status update successful',
        {
          updatedCount: result.modifiedCount,
          totalRequested: bazarIds.length,
        }
      );
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
          $lte: new Date(endDate),
        };
      }

      // Get summary by category
      const summary = await Bazar.getSummaryByCategory(query);

      return sendSuccessResponse(
        res,
        200,
        'Bazar summary by category retrieved successfully',
        summary
      );
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

      return sendSuccessResponse(
        res,
        200,
        'Bazar trends retrieved successfully',
        trends
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin override: Create bazar entry for any user (admin only)
  async createBazarForUser(req, res, next) {
    try {
      const {
        userId,
        items,
        totalAmount,
        description,
        date,
        status = 'approved',
      } = req.body;
      const adminId = req.user.id;
      const receiptImage = req.file ? req.file.path : null;

      // Validate admin permissions
      if (req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Admin privileges required for this operation'
        );
      }

      // Validate required fields
      if (!userId) {
        return sendErrorResponse(res, 400, 'User ID is required');
      }

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendErrorResponse(res, 400, 'Items array is required');
      }

      // Validate total amount
      if (!totalAmount || totalAmount <= 0) {
        return sendErrorResponse(res, 400, 'Valid total amount is required');
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Create bazar entry with admin override
      const bazar = await Bazar.create({
        userId,
        items,
        totalAmount,
        description,
        date: new Date(date),
        receiptImage,
        status,
        approvedBy: adminId,
        approvedAt: new Date(),
        notes: `Created by admin ${req.user.email}`,
      });

      // Populate user information
      await bazar.populate('userId', 'name email');
      await bazar.populate('approvedBy', 'name');

      logger.info(
        `Admin ${req.user.email} created bazar entry for user ${user.email} with amount ${totalAmount}`
      );

      return sendSuccessResponse(
        res,
        201,
        'Bazar entry created successfully by admin',
        bazar
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin override: Update any bazar entry (admin only)
  async adminUpdateBazar(req, res, next) {
    try {
      const { bazarId } = req.params;
      const { items, totalAmount, description, date, status, notes } = req.body;
      const adminId = req.user.id;

      // Validate admin permissions
      if (req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Admin privileges required for this operation'
        );
      }

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      // Update fields if provided
      if (items) bazar.items = items;
      if (totalAmount !== undefined) bazar.totalAmount = totalAmount;
      if (description !== undefined) bazar.description = description;
      if (date) bazar.date = new Date(date);
      if (status) bazar.status = status;
      if (notes !== undefined) bazar.notes = notes;

      // Update approval info
      bazar.approvedBy = adminId;
      bazar.approvedAt = new Date();

      await bazar.save();

      // Populate user information
      await bazar.populate('userId', 'name email');
      await bazar.populate('approvedBy', 'name');

      logger.info(
        `Admin ${req.user.email} updated bazar entry ${bazarId} for user ${bazar.userId.email}`
      );

      return sendSuccessResponse(
        res,
        200,
        'Bazar entry updated successfully by admin',
        bazar
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin override: Delete any bazar entry (admin only)
  async adminDeleteBazar(req, res, next) {
    try {
      const { bazarId } = req.params;
      const adminId = req.user.id;

      // Validate admin permissions
      if (req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Admin privileges required for this operation'
        );
      }

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      // Log the deletion for audit purposes
      logger.info(
        `Admin ${req.user.email} deleted bazar entry ${bazarId} for user ${bazar.userId}`
      );

      await Bazar.findByIdAndDelete(bazarId);

      return sendSuccessResponse(
        res,
        200,
        'Bazar entry deleted successfully by admin'
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin override: Bulk operations (admin only)
  async adminBulkOperations(req, res, next) {
    try {
      const { operation, bazarIds, status, notes } = req.body;
      const adminId = req.user.id;

      // Validate admin permissions
      if (req.user.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Admin privileges required for this operation'
        );
      }

      if (!bazarIds || !Array.isArray(bazarIds) || bazarIds.length === 0) {
        return sendErrorResponse(res, 400, 'Bazar IDs array is required');
      }

      let result;

      switch (operation) {
        case 'approve':
          result = await Bazar.updateMany(
            { _id: { $in: bazarIds } },
            {
              status: 'approved',
              approvedBy: adminId,
              approvedAt: new Date(),
              notes: notes || 'Bulk approved by admin',
            }
          );
          break;

        case 'reject':
          result = await Bazar.updateMany(
            { _id: { $in: bazarIds } },
            {
              status: 'rejected',
              approvedBy: adminId,
              approvedAt: new Date(),
              notes: notes || 'Bulk rejected by admin',
            }
          );
          break;

        case 'delete':
          result = await Bazar.deleteMany({ _id: { $in: bazarIds } });
          break;

        default:
          return sendErrorResponse(
            res,
            400,
            'Invalid operation. Supported operations: approve, reject, delete'
          );
      }

      logger.info(
        `Admin ${req.user.email} performed bulk operation: ${operation} on ${bazarIds.length} bazar entries`
      );

      return sendSuccessResponse(
        res,
        200,
        `Bulk ${operation} completed successfully`,
        {
          operation,
          affectedCount: result.modifiedCount || result.deletedCount,
          totalRequested: bazarIds.length,
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BazarController();
