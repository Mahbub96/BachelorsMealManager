const mongoose = require('mongoose');
const Bazar = require('../models/Bazar');
const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { getGroupMemberIds } = require('../utils/groupHelper');
const {
  buildBazarListQuery,
  findBazarEntriesPaginated,
  buildStatsFilters,
} = require('../utils/bazarHelper');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class BazarController {
  // Submit bazar entry
  async submitBazar(req, res, next) {
    try {
      const { items, totalAmount, description, date, type = 'meal' } = req.body;
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

      const bazarType = type === 'flat' ? 'flat' : 'meal';
      const bazar = await Bazar.create({
        userId,
        items,
        totalAmount,
        description,
        date: new Date(date),
        receiptImage,
        type: bazarType,
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
      const { startDate, endDate, status, type, limit = 10, page = 1 } = req.query;
      const query = buildBazarListQuery({
        userId: req.user.id,
        startDate,
        endDate,
        status,
        type: type === 'flat' ? 'flat' : type === 'meal' ? 'meal' : undefined,
      });
      const { bazarEntries, pagination } = await findBazarEntriesPaginated(
        Bazar,
        query,
        { limit, page }
      );
      return sendSuccessResponse(
        res,
        200,
        'User bazar entries retrieved successfully',
        { bazarEntries, pagination }
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
        userId: queryUserId,
        type,
        limit = 20,
        page = 1,
      } = req.query;

      if (queryUserId && !mongoose.Types.ObjectId.isValid(queryUserId)) {
        return sendErrorResponse(res, 400, 'Invalid userId');
      }

      const groupMemberIds = await getGroupMemberIds(req.user);
      const query = buildBazarListQuery({
        userId: queryUserId && mongoose.Types.ObjectId.isValid(queryUserId) ? queryUserId : undefined,
        userIds:
          !queryUserId &&
          Array.isArray(groupMemberIds) &&
          groupMemberIds.length > 0
            ? groupMemberIds
            : undefined,
        status,
        startDate,
        endDate,
        type: type === 'flat' ? 'flat' : type === 'meal' ? 'meal' : undefined,
        defaultCurrentMonth: !startDate && !endDate,
      });

      const { bazarEntries, pagination } = await findBazarEntriesPaginated(
        Bazar,
        query,
        { limit, page }
      );

      return sendSuccessResponse(
        res,
        200,
        'All bazar entries retrieved successfully',
        { bazarEntries, pagination }
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
      const filters = { ...buildStatsFilters(startDate, endDate) };
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return sendErrorResponse(res, 400, 'Invalid userId');
        }
        filters.userId = userId;
      }
      const stats = await Bazar.getStats(filters);
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
      const { startDate, endDate } = req.query;
      const filters = buildStatsFilters(startDate, endDate);
      const stats = await Bazar.getUserStats(req.user.id, filters);
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
      const { items, totalAmount, description, type } = req.body;
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
      if (type === 'meal' || type === 'flat') updateData.type = type;

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

  // Get bazar by ID (own entry or group member's entry for admin/member)
  async getBazarById(req, res, next) {
    try {
      const { bazarId } = req.params;
      const currentUserId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(bazarId)) {
        return sendErrorResponse(res, 400, 'Invalid bazar ID');
      }

      const bazar = await Bazar.findById(bazarId)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name');

      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      const entryUserId =
        bazar.userId && (bazar.userId._id || bazar.userId).toString();
      const isOwn = entryUserId === currentUserId;
      if (isOwn) {
        return sendSuccessResponse(
          res,
          200,
          'Bazar entry retrieved successfully',
          bazar
        );
      }

      const groupMemberIds = await getGroupMemberIds(req.user);
      const isInGroup =
        Array.isArray(groupMemberIds) &&
        groupMemberIds.length > 0 &&
        groupMemberIds.some((id) => id && id.toString() === entryUserId);
      if (isInGroup) {
        return sendSuccessResponse(
          res,
          200,
          'Bazar entry retrieved successfully',
          bazar
        );
      }

      return sendErrorResponse(res, 403, 'Access denied to this bazar entry');
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
      const filters = buildStatsFilters(startDate, endDate);
      const summary = await Bazar.getSummaryByCategory(filters);

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
      const allowedPeriods = ['week', 'month', 'year'];
      const periodVal =
        typeof period === 'string' && allowedPeriods.includes(period)
          ? period
          : 'month';

      const trends = await Bazar.getTrends(periodVal);

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
        type = 'meal',
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
      const bazarType = type === 'flat' ? 'flat' : 'meal';
      const bazar = await Bazar.create({
        userId,
        items,
        totalAmount,
        description,
        date: new Date(date),
        receiptImage,
        type: bazarType,
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
      const { items, totalAmount, description, date, type, status, notes } = req.body;
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

      if (items) bazar.items = items;
      if (totalAmount !== undefined) bazar.totalAmount = totalAmount;
      if (description !== undefined) bazar.description = description;
      if (date) bazar.date = new Date(date);
      if (type === 'meal' || type === 'flat') bazar.type = type;
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
