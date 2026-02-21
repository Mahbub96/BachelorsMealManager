const RemovalRequest = require('../models/RemovalRequest');
const User = require('../models/User');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

class RemovalRequestController {
  /**
   * Create a removal request.
   * - Member: type 'member_leave' (request to leave; admin will accept/reject).
   * - Admin: type 'admin_removal' with userId (member must accept to be removed).
   */
  async create(req, res, next) {
    try {
      const currentUser = req.user;
      const { type, userId } = req.body;

      if (type === 'member_leave') {
        if (currentUser.role === 'member') {
          const existing = await RemovalRequest.findOne({
            userId: currentUser._id,
            type: 'member_leave',
            status: 'pending',
          });
          if (existing) {
            return sendErrorResponse(
              res,
              400,
              'You already have a pending leave request.'
            );
          }
          const request = await RemovalRequest.create({
            userId: currentUser._id,
            type: 'member_leave',
            requestedBy: currentUser._id,
            status: 'pending',
          });
          const populated = await RemovalRequest.findById(request._id)
            .populate('userId', 'name email')
            .populate('requestedBy', 'name email');
          return sendSuccessResponse(
            res,
            201,
            'Leave request submitted. Admin will review it.',
            populated
          );
        }
        return sendErrorResponse(res, 403, 'Only members can request to leave.');
      }

      if (type === 'admin_removal') {
        if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
          return sendErrorResponse(res, 403, 'Only admins can request member removal.');
        }
        if (!userId) {
          return sendErrorResponse(res, 400, 'userId is required for admin removal request.');
        }
        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return sendErrorResponse(res, 404, 'User not found.');
        }
        if (targetUser.role !== 'member') {
          return sendErrorResponse(res, 400, 'Can only request removal of members.');
        }
        if (currentUser.role === 'admin' && targetUser.createdBy?.toString() !== currentUser._id.toString()) {
          return sendErrorResponse(res, 403, 'You can only request removal of members you created.');
        }
        const existing = await RemovalRequest.findOne({
          userId: targetUser._id,
          type: 'admin_removal',
          status: 'pending',
        });
        if (existing) {
          return sendErrorResponse(
            res,
            400,
            'A removal request for this member is already pending.'
          );
        }
        const request = await RemovalRequest.create({
          userId: targetUser._id,
          type: 'admin_removal',
          requestedBy: currentUser._id,
          status: 'pending',
        });
        const populated = await RemovalRequest.findById(request._id)
          .populate('userId', 'name email')
          .populate('requestedBy', 'name email');
        return sendSuccessResponse(
          res,
          201,
          'Removal request sent. The member must accept to be removed.',
          populated
        );
      }

      return sendErrorResponse(res, 400, 'Invalid type. Use member_leave or admin_removal.');
    } catch (error) {
      logger.error('Error in removalRequest create:', error);
      next(error);
    }
  }

  /**
   * List removal requests.
   * - Member: pending requests where they are the userId (leave requests they made, or admin_removal for them).
   * - Admin: pending leave requests from their members; pending admin_removal they created.
   */
  async list(req, res, next) {
    try {
      const currentUser = req.user;

      if (currentUser.role === 'member') {
        const requests = await RemovalRequest.find({
          userId: currentUser._id,
          status: 'pending',
        })
          .populate('userId', 'name email')
          .populate('requestedBy', 'name email')
          .sort({ createdAt: -1 });
        return sendSuccessResponse(res, 200, 'Removal requests retrieved.', { requests });
      }

      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        let query = { status: 'pending' };
        if (currentUser.role === 'admin') {
          const memberIds = await User.find({ createdBy: currentUser._id, role: 'member' }).distinct('_id');
          query.$or = [
            { type: 'member_leave', userId: { $in: memberIds } },
            { type: 'admin_removal', requestedBy: currentUser._id },
          ];
        }
        const requests = await RemovalRequest.find(query)
          .populate('userId', 'name email')
          .populate('requestedBy', 'name email')
          .sort({ createdAt: -1 });
        return sendSuccessResponse(res, 200, 'Removal requests retrieved.', { requests });
      }

      return sendErrorResponse(res, 403, 'Access denied.');
    } catch (error) {
      logger.error('Error in removalRequest list:', error);
      next(error);
    }
  }

  /**
   * Accept a request.
   * - member_leave: only admin can accept → deletes the member.
   * - admin_removal: only the member (userId) can accept → deletes self.
   */
  async accept(req, res, next) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      const removalRequest = await RemovalRequest.findById(id)
        .populate('userId', 'name email role createdBy');
      if (!removalRequest) {
        return sendErrorResponse(res, 404, 'Request not found.');
      }
      if (removalRequest.status !== 'pending') {
        return sendErrorResponse(res, 400, 'Request is no longer pending.');
      }

      if (removalRequest.type === 'member_leave') {
        if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
          return sendErrorResponse(res, 403, 'Only admin can accept leave requests.');
        }
        const member = removalRequest.userId;
        if (currentUser.role === 'admin' && member.createdBy?.toString() !== currentUser._id.toString()) {
          return sendErrorResponse(res, 403, 'You can only accept leave requests from members you created.');
        }
        removalRequest.status = 'accepted';
        removalRequest.resolvedAt = new Date();
        removalRequest.resolvedBy = currentUser._id;
        await removalRequest.save();
        await User.findByIdAndDelete(removalRequest.userId._id);
        logger.info(`Leave request accepted; user ${removalRequest.userId._id} deleted by ${currentUser.email}`);
        return sendSuccessResponse(res, 200, 'Leave request accepted. Member has been removed.', {
          request: removalRequest,
        });
      }

      if (removalRequest.type === 'admin_removal') {
        if (removalRequest.userId._id.toString() !== currentUser._id.toString()) {
          return sendErrorResponse(res, 403, 'Only the requested member can accept this removal.');
        }
        removalRequest.status = 'accepted';
        removalRequest.resolvedAt = new Date();
        removalRequest.resolvedBy = currentUser._id;
        await removalRequest.save();
        await User.findByIdAndDelete(currentUser._id);
        logger.info(`Removal request accepted; user ${currentUser._id} deleted (self).`);
        return sendSuccessResponse(res, 200, 'You have been removed from the group.', {
          request: removalRequest,
        });
      }

      return sendErrorResponse(res, 400, 'Invalid request type.');
    } catch (error) {
      logger.error('Error in removalRequest accept:', error);
      next(error);
    }
  }

  /**
   * Reject / decline a request.
   * - member_leave: only admin can reject.
   * - admin_removal: only the member can decline.
   */
  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      const removalRequest = await RemovalRequest.findById(id).populate('userId', 'createdBy');
      if (!removalRequest) {
        return sendErrorResponse(res, 404, 'Request not found.');
      }
      if (removalRequest.status !== 'pending') {
        return sendErrorResponse(res, 400, 'Request is no longer pending.');
      }

      if (removalRequest.type === 'member_leave') {
        if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
          return sendErrorResponse(res, 403, 'Only admin can reject leave requests.');
        }
        const member = removalRequest.userId;
        if (currentUser.role === 'admin' && member.createdBy?.toString() !== currentUser._id.toString()) {
          return sendErrorResponse(res, 403, 'You can only reject leave requests from members you created.');
        }
        removalRequest.status = 'rejected';
        removalRequest.resolvedAt = new Date();
        removalRequest.resolvedBy = currentUser._id;
        await removalRequest.save();
        return sendSuccessResponse(res, 200, 'Leave request rejected.', { request: removalRequest });
      }

      if (removalRequest.type === 'admin_removal') {
        if (removalRequest.userId._id.toString() !== currentUser._id.toString()) {
          return sendErrorResponse(res, 403, 'Only the requested member can decline this removal.');
        }
        removalRequest.status = 'rejected';
        removalRequest.resolvedAt = new Date();
        removalRequest.resolvedBy = currentUser._id;
        await removalRequest.save();
        return sendSuccessResponse(res, 200, 'Removal request declined.', { request: removalRequest });
      }

      return sendErrorResponse(res, 400, 'Invalid request type.');
    } catch (error) {
      logger.error('Error in removalRequest reject:', error);
      next(error);
    }
  }
}

const controller = new RemovalRequestController();
module.exports = {
  create: controller.create.bind(controller),
  list: controller.list.bind(controller),
  accept: controller.accept.bind(controller),
  reject: controller.reject.bind(controller),
};
