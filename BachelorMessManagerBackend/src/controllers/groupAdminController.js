const User = require('../models/User');
const AdminChangeRequest = require('../models/AdminChangeRequest');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');
const { getGroupMemberIds } = require('../utils/groupHelper');
const notificationService = require('../services/notificationService');

class GroupAdminController {
  /**
   * Create a new admin change request for the caller's group.
   * - Only members can initiate.
   * - Only one pending request per group.
   * - Candidate must be an active member in the same group.
   */
  async createChangeRequest(req, res, next) {
    try {
      const currentUser = req.user;
      const { candidateId } = req.body || {};

      if (!candidateId) {
        return sendErrorResponse(res, 400, 'candidateId is required');
      }

      if (currentUser.role !== 'member') {
        return sendErrorResponse(
          res,
          403,
          'Only group members can start an admin change vote.'
        );
      }

      if (!currentUser.createdBy) {
        return sendErrorResponse(
          res,
          400,
          'You are not assigned to any group admin.'
        );
      }

      const groupAdminId = currentUser.createdBy;

      const existing = await AdminChangeRequest.findOne({
        groupAdminId,
        status: 'pending',
      });
      if (existing) {
        const alreadyVoted = existing.votes.some(
          v => v.voter.toString() === currentUser._id.toString()
        );
        if (alreadyVoted) {
          return sendErrorResponse(
            res,
            400,
            'You have already voted in this round. You cannot vote again until the admin resets the vote or a new vote is arranged.'
          );
        }
        return sendErrorResponse(
          res,
          409,
          'A pending admin change request already exists for this group. You can join that vote or wait for admin to reset.'
        );
      }

      const candidate = await User.findById(candidateId).select(
        'role status createdBy'
      );
      if (!candidate) {
        return sendErrorResponse(res, 404, 'Candidate user not found.');
      }
      if (candidate.status !== 'active') {
        return sendErrorResponse(
          res,
          400,
          'Candidate must be an active user.'
        );
      }
      if (candidate.role !== 'member') {
        return sendErrorResponse(
          res,
          400,
          'Candidate must be a member, not an admin.'
        );
      }
      if (
        !candidate.createdBy ||
        candidate.createdBy.toString() !== groupAdminId.toString()
      ) {
        return sendErrorResponse(
          res,
          400,
          'Candidate must belong to your group.'
        );
      }

      const request = await AdminChangeRequest.create({
        groupAdminId,
        candidateId: candidate._id,
        createdBy: currentUser._id,
        votes: [
          {
            voter: currentUser._id,
          },
        ],
      });

      const populated = await AdminChangeRequest.findById(request._id)
        .populate('groupAdminId', 'name email role')
        .populate('candidateId', 'name email role')
        .populate('createdBy', 'name email')
        .populate('votes.voter', 'name email');

      return sendSuccessResponse(
        res,
        201,
        'Admin change request created. All group members must vote.',
        populated
      );

      // Note: notification is sent below after response (fire-and-forget)
    } catch (error) {
      logger.error('Error in createChangeRequest:', error);
      next(error);
    }
  }

  /**
   * Cast a vote for an existing admin change request.
   * - Only members in that group can vote.
   * - Each member can vote once.
   * - When all active members of the group have voted, role change is applied.
   */
  async voteOnChangeRequest(req, res, next) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      const request = await AdminChangeRequest.findById(id);
      if (!request) {
        return sendErrorResponse(res, 404, 'Admin change request not found.');
      }

      if (request.status !== 'pending') {
        return sendErrorResponse(
          res,
          400,
          'This admin change request is no longer pending.'
        );
      }

      if (currentUser.role !== 'member') {
        return sendErrorResponse(
          res,
          403,
          'Only group members can vote on admin change requests.'
        );
      }

      if (
        !currentUser.createdBy ||
        currentUser.createdBy.toString() !==
          request.groupAdminId.toString()
      ) {
        return sendErrorResponse(
          res,
          403,
          'You are not a member of this group.'
        );
      }

      const alreadyVoted = request.votes.some(
        v => v.voter.toString() === currentUser._id.toString()
      );
      if (alreadyVoted) {
        return sendErrorResponse(
          res,
          400,
          'You have already voted in this round. You cannot vote again until the admin resets the vote or a new vote is arranged.'
        );
      }

      request.votes.push({
        voter: currentUser._id,
        votedAt: new Date(),
      });

      await request.save();

      const totalMembers = await User.countDocuments({
        role: 'member',
        status: 'active',
        createdBy: request.groupAdminId,
      });

      if (totalMembers === 0) {
        return sendErrorResponse(
          res,
          400,
          'No active members found in this group.'
        );
      }

      if (request.votes.length >= totalMembers) {
        const [candidate, groupAdmin] = await Promise.all([
          User.findById(request.candidateId).select('role status createdBy'),
          User.findById(request.groupAdminId).select('role status'),
        ]);

        if (!candidate || !groupAdmin) {
          return sendErrorResponse(
            res,
            400,
            'Group users changed during voting. Please try again.'
          );
        }

        if (candidate.status !== 'active' || groupAdmin.status !== 'active') {
          return sendErrorResponse(
            res,
            400,
            'Group users must be active to complete admin change.'
          );
        }

        await User.updateMany(
          {
            createdBy: request.groupAdminId,
            _id: { $ne: candidate._id },
          },
          {
            $set: { createdBy: candidate._id },
          }
        );

        await User.updateOne(
          { _id: request.groupAdminId },
          {
            $set: {
              role: 'member',
              createdBy: candidate._id,
            },
          }
        );

        await User.updateOne(
          { _id: candidate._id },
          {
            $set: {
              role: 'admin',
              createdBy: null,
            },
          }
        );

        request.status = 'completed';
        request.completedAt = new Date();
        request.completedBy = candidate._id;
        await request.save();
      }

      const updated = await AdminChangeRequest.findById(request._id)
        .populate('groupAdminId', 'name email role')
        .populate('candidateId', 'name email role')
        .populate('createdBy', 'name email')
        .populate('votes.voter', 'name email');

      const remainingVotes =
        totalMembers > updated.votes.length
          ? totalMembers - updated.votes.length
          : 0;

      return sendSuccessResponse(
        res,
        200,
        'Vote recorded successfully.',
        {
          request: updated,
          requiredVotes: totalMembers,
          remainingVotes,
        }
      );
    } catch (error) {
      logger.error('Error in voteOnChangeRequest:', error);
      next(error);
    }
  }

  /**
   * Cancel the current pending admin change request (admin only).
   * Resets the round so members can vote again.
   */
  async cancelChangeRequest(req, res, next) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Only the group admin can reset the current vote.'
        );
      }

      const request = await AdminChangeRequest.findOneAndUpdate(
        { groupAdminId: currentUser._id, status: 'pending' },
        { status: 'cancelled' },
        { new: true }
      );

      if (!request) {
        return sendErrorResponse(
          res,
          404,
          'No pending admin change request to cancel for this group.'
        );
      }

      return sendSuccessResponse(
        res,
        200,
        'Vote round cancelled. Members can start or join a new vote.',
        { requestId: request._id }
      );
    } catch (error) {
      logger.error('Error in cancelChangeRequest:', error);
      next(error);
    }
  }

  /**
   * Get the current pending admin change request for the caller's group.
   */
  async getCurrentChangeRequest(req, res, next) {
    try {
      const currentUser = req.user;

      let groupAdminId = null;
      if (currentUser.role === 'admin') {
        groupAdminId = currentUser._id;
      } else if (currentUser.role === 'member' && currentUser.createdBy) {
        groupAdminId = currentUser.createdBy;
      } else {
        return sendErrorResponse(
          res,
          400,
          'You are not part of any admin-managed group.'
        );
      }

      const request = await AdminChangeRequest.findOne({
        groupAdminId,
        status: 'pending',
      })
        .sort({ createdAt: -1 })
        .populate('groupAdminId', 'name email role')
        .populate('candidateId', 'name email role')
        .populate('createdBy', 'name email')
        .populate('votes.voter', 'name email');

      if (!request) {
        return sendSuccessResponse(
          res,
          200,
          'No pending admin change request for this group.',
          null
        );
      }

      const totalMembers = await User.countDocuments({
        role: 'member',
        status: 'active',
        createdBy: groupAdminId,
      });

      const remainingVotes =
        totalMembers > request.votes.length
          ? totalMembers - request.votes.length
          : 0;

      return sendSuccessResponse(
        res,
        200,
        'Current admin change request retrieved successfully.',
        {
          request,
          requiredVotes: totalMembers,
          remainingVotes,
        }
      );
    } catch (error) {
      logger.error('Error in getCurrentChangeRequest:', error);
      next(error);
    }
  }

  /**
   * Get group members for the current user (admin or member).
   * - Admin/member: returns admin + all active members in that admin's group.
   * - Super admin or users without group: empty list.
   */
  async getGroupMembers(req, res, next) {
    try {
      const groupMemberIds = await getGroupMemberIds(req.user);

      if (!groupMemberIds || groupMemberIds.length === 0) {
        return sendSuccessResponse(
          res,
          200,
          'No group members found for this user.',
          { members: [] }
        );
      }

      const members = await User.find({
        _id: { $in: groupMemberIds },
        status: 'active',
      })
        .select('name email role status')
        .sort({ role: 1, createdAt: 1 });

      const formatted = members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
      }));

      return sendSuccessResponse(
        res,
        200,
        'Group members retrieved successfully.',
        { members: formatted }
      );
    } catch (error) {
      logger.error('Error in getGroupMembers:', error);
      next(error);
    }
  }
}

module.exports = new GroupAdminController();

