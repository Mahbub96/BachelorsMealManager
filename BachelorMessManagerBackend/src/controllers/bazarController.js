const mongoose = require('mongoose');
const Bazar = require('../models/Bazar');
const BazarDeleteRequest = require('../models/BazarDeleteRequest');
const User = require('../models/User');
const StatisticsService = require('../services/statisticsService');
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
const ledgerService = require('../services/ledgerService');

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

      await ledgerService.createEntry(req.user, {
        userId: bazar.userId,
        type: bazarType === 'flat' ? 'flat_bazar' : 'meal_bazar',
        amount: bazar.totalAmount,
        refType: 'Bazar',
        refId: bazar._id,
        description: `${bazarType === 'flat' ? 'Flat' : 'Meal'} bazar ৳${bazar.totalAmount}`,
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

      if (status === 'approved') {
        const ledgerType = bazar.type === 'flat' ? 'flat_bazar' : 'meal_bazar';
        await ledgerService.createEntry(req.user, {
          userId: bazar.userId,
          type: ledgerType,
          amount: bazar.totalAmount,
          refType: 'Bazar',
          refId: bazar._id,
          description: `Bazar approved: ৳${bazar.totalAmount}`,
        });
      }

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

  // Delete bazar entry (only owner; admin must use delete request so owner can confirm)
  async deleteBazar(req, res, next) {
    try {
      const bazarId = (req.params.bazarId || '').trim();
      const userId = req.user.id;

      if (!bazarId || !mongoose.Types.ObjectId.isValid(bazarId)) {
        return sendErrorResponse(res, 400, 'Invalid bazar ID');
      }

      const bazar = await Bazar.findById(bazarId);
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      const isAdminOrSuper = ['admin', 'super_admin'].includes(req.user.role);
      const isOwner = bazar.userId.toString() === userId;

      if (!isOwner) {
        if (isAdminOrSuper) {
          return sendErrorResponse(
            res,
            400,
            'To delete another member\'s bazar entry, use "Request deletion" so the entry owner can confirm.'
          );
        }
        return sendErrorResponse(res, 403, 'Access denied');
      }

      await Bazar.findByIdAndDelete(bazarId);
      try {
        await StatisticsService.updateAfterOperation('bazar_deleted', { bazarId });
      } catch (statsErr) {
        logger.error('Statistics update after bazar delete failed:', statsErr);
      }

      logger.info(`Bazar entry deleted by owner ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Bazar entry deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Create delete request (admin/super_admin only); bazar owner must confirm
  async createDeleteRequest(req, res, next) {
    try {
      const bazarId = (req.params.bazarId || '').trim();
      const userId = req.user.id;

      if (!bazarId || !mongoose.Types.ObjectId.isValid(bazarId)) {
        return sendErrorResponse(res, 400, 'Invalid bazar ID');
      }

      const isAdminOrSuper = ['admin', 'super_admin'].includes(req.user.role);
      if (!isAdminOrSuper) {
        return sendErrorResponse(res, 403, 'Only admin can request bazar deletion');
      }

      const bazar = await Bazar.findById(bazarId).populate('userId', 'name email');
      if (!bazar) {
        return sendErrorResponse(res, 404, 'Bazar entry not found');
      }

      const ownerId = (bazar.userId._id || bazar.userId).toString();
      if (ownerId === userId) {
        return sendErrorResponse(res, 400, 'Use direct delete for your own bazar entry');
      }

      const existing = await BazarDeleteRequest.findOne({ bazarId, status: 'pending' });
      if (existing) {
        return sendErrorResponse(res, 400, 'A delete request for this bazar entry is already pending');
      }

      const bazarSummary = `${bazar.items?.length || 0} items, ৳${(bazar.totalAmount || 0).toLocaleString()}`;

      const request = await BazarDeleteRequest.create({
        bazarId,
        requestedBy: userId,
        requestedFor: bazar.userId._id || bazar.userId,
        status: 'pending',
        bazarDate: bazar.date,
        bazarSummary,
        totalAmount: bazar.totalAmount || 0,
      });

      const populated = await BazarDeleteRequest.findById(request._id)
        .populate('requestedBy', 'name email')
        .populate('requestedFor', 'name email');

      logger.info(`Bazar delete request created by ${req.user.email} for bazar ${bazarId}`);

      return sendSuccessResponse(
        res,
        201,
        'Delete request sent. The bazar entry owner must confirm to delete.',
        populated
      );
    } catch (error) {
      next(error);
    }
  }

  // List delete requests for current user (pending only)
  async getMyDeleteRequests(req, res, next) {
    try {
      const userId = req.user.id;

      const requests = await BazarDeleteRequest.find({ requestedFor: userId, status: 'pending' })
        .populate('requestedBy', 'name email')
        .populate('requestedFor', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      return sendSuccessResponse(res, 200, 'Delete requests retrieved', requests);
    } catch (error) {
      next(error);
    }
  }

  // Respond to delete request (accept or reject); only bazar owner. Atomic update.
  async respondToDeleteRequest(req, res, next) {
    try {
      const requestId = (req.params.requestId || '').trim();
      const action = req.body && (req.body.action === 'accept' || req.body.action === 'reject') ? req.body.action : null;
      const userId = req.user.id;

      if (!action) {
        return sendErrorResponse(res, 400, 'Action must be accept or reject');
      }

      if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
        return sendErrorResponse(res, 400, 'Invalid request ID');
      }

      const respondedAt = new Date();
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      const request = await BazarDeleteRequest.findOneAndUpdate(
        { _id: requestId, requestedFor: userId, status: 'pending' },
        { $set: { status: newStatus, respondedAt } },
        { new: true }
      );

      if (!request) {
        const exists = await BazarDeleteRequest.findById(requestId).select('status requestedFor').lean();
        if (!exists) return sendErrorResponse(res, 404, 'Delete request not found');
        if (exists.status !== 'pending') return sendErrorResponse(res, 400, 'This request was already responded to');
        return sendErrorResponse(res, 403, 'Only the bazar entry owner can respond to this request');
      }

      if (action === 'accept') {
        const bazar = await Bazar.findById(request.bazarId);
        if (!bazar) {
          await BazarDeleteRequest.findByIdAndUpdate(request._id, { $set: { status: 'rejected' } });
          return sendErrorResponse(res, 404, 'Bazar entry no longer exists');
        }
        await Bazar.findByIdAndDelete(request.bazarId);
        try {
          await StatisticsService.updateAfterOperation('bazar_deleted', { bazarId: request.bazarId });
        } catch (statsErr) {
          logger.error('Statistics update after bazar delete failed:', statsErr);
        }
        logger.info(`Bazar ${request.bazarId} deleted after owner ${req.user.email} accepted delete request`);
      }

      const populated = await BazarDeleteRequest.findById(request._id)
        .populate('requestedBy', 'name email')
        .populate('requestedFor', 'name email')
        .lean();

      const message = action === 'accept'
        ? 'Bazar entry deleted successfully. All related data has been updated.'
        : 'Delete request rejected.';

      return sendSuccessResponse(res, 200, message, populated);
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

      await ledgerService.createEntry(req.user, {
        userId: bazar.userId,
        type: bazarType === 'flat' ? 'flat_bazar' : 'meal_bazar',
        amount: bazar.totalAmount,
        refType: 'Bazar',
        refId: bazar._id,
        description: `Admin: ${bazarType === 'flat' ? 'Flat' : 'Meal'} bazar ৳${bazar.totalAmount}`,
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

  // Admin override: Delete any bazar entry — use delete-request flow so owner confirms
  async adminDeleteBazar(req, res) {
    return sendErrorResponse(
      res,
      400,
      'To delete another member\'s bazar entry, use "Request deletion" so the entry owner can confirm.'
    );
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
          return sendErrorResponse(
            res,
            400,
            'Bulk direct delete is not allowed. Use "Request deletion" on each entry so the owner can confirm.'
          );

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
