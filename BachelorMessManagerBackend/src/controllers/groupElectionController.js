const User = require('../models/User');
const Election = require('../models/Election');
const logger = require('../utils/logger');
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require('../utils/responseHandler');

/**
 * Election flow: Admin arranges → Members apply as candidates → Admin starts → Members vote.
 * One active election per group (accepting_candidates or voting).
 */
class GroupElectionController {
  /**
   * Admin arranges an election (sets date). Creates election in 'accepting_candidates'.
   */
  async createElection(req, res, next) {
    try {
      const currentUser = req.user;
      const { electionDate } = req.body || {};
      let parsedDate = null;
      if (electionDate) {
        parsedDate = new Date(electionDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return sendErrorResponse(res, 400, 'Invalid electionDate format.');
        }
      }

      if (currentUser.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Only the group admin can arrange an election.'
        );
      }

      const existing = await Election.findOne({
        groupAdminId: currentUser._id,
        status: { $in: ['accepting_candidates', 'voting'] },
      });
      if (existing) {
        return sendErrorResponse(
          res,
          409,
          'An election is already in progress. Cancel it first or wait for it to complete.'
        );
      }

      const election = await Election.create({
        groupAdminId: currentUser._id,
        status: 'accepting_candidates',
        electionDate: parsedDate,
        arrangedBy: currentUser._id,
      });

      const populated = await Election.findById(election._id)
        .populate('groupAdminId', 'name email role')
        .populate('arrangedBy', 'name email')
        .populate('candidates.userId', 'name email');

      return sendSuccessResponse(
        res,
        201,
        'Election arranged. Members can now apply to be candidates.',
        populated
      );
    } catch (error) {
      logger.error('Error in createElection:', error);
      next(error);
    }
  }

  /**
   * Get current election for the caller's group (accepting_candidates or voting).
   */
  async getCurrentElection(req, res, next) {
    try {
      const currentUser = req.user;
      let groupAdminId = null;
      if (currentUser.role === 'admin') {
        groupAdminId = currentUser._id;
      } else if (currentUser.role === 'member' && currentUser.createdBy) {
        groupAdminId = currentUser.createdBy;
      } else {
        return sendSuccessResponse(res, 200, 'No group.', {
          election: null,
          totalMembers: 0,
          votedCount: 0,
          remainingVotes: 0,
        });
      }

      const election = await Election.findOne({
        groupAdminId,
        status: { $in: ['accepting_candidates', 'voting'] },
      })
        .sort({ createdAt: -1 })
        .populate('groupAdminId', 'name email role')
        .populate('arrangedBy', 'name email')
        .populate('candidates.userId', 'name email')
        .populate('votes.voterId', 'name email')
        .populate('votes.candidateId', 'name email');

      if (!election) {
        return sendSuccessResponse(res, 200, 'No active election.', {
          election: null,
          totalMembers: 0,
          votedCount: 0,
          remainingVotes: 0,
        });
      }

      const totalMembers = await User.countDocuments({
        role: 'member',
        status: 'active',
        createdBy: groupAdminId,
      });
      const votedCount =
        election.votes && election.votes.length ? election.votes.length : 0;
      const remainingVotes = Math.max(0, totalMembers - votedCount);

      return sendSuccessResponse(res, 200, 'Current election.', {
        election,
        totalMembers,
        votedCount,
        remainingVotes,
      });
    } catch (error) {
      logger.error('Error in getCurrentElection:', error);
      next(error);
    }
  }

  /**
   * Member applies to be a candidate (only when status is accepting_candidates).
   */
  async applyAsCandidate(req, res, next) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== 'member') {
        return sendErrorResponse(
          res,
          403,
          'Only group members can apply to be a candidate.'
        );
      }
      if (!currentUser.createdBy) {
        return sendErrorResponse(
          res,
          400,
          'You are not assigned to any group.'
        );
      }

      const election = await Election.findOne({
        groupAdminId: currentUser.createdBy,
        status: 'accepting_candidates',
      });
      if (!election) {
        return sendErrorResponse(
          res,
          404,
          'No election is currently accepting candidates.'
        );
      }

      const alreadyApplied = (election.candidates || []).some(
        c => c.userId && c.userId.toString() === currentUser._id.toString()
      );
      if (alreadyApplied) {
        return sendErrorResponse(
          res,
          400,
          'You have already applied to be a candidate.'
        );
      }

      election.candidates.push({ userId: currentUser._id });
      await election.save();

      const populated = await Election.findById(election._id)
        .populate('candidates.userId', 'name email');

      return sendSuccessResponse(
        res,
        200,
        'You have applied to be a candidate.',
        populated
      );
    } catch (error) {
      logger.error('Error in applyAsCandidate:', error);
      next(error);
    }
  }

  /**
   * Admin starts the election (moves to 'voting'). Members can then vote.
   */
  async startElection(req, res, next) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Only the group admin can start the election.'
        );
      }

      const election = await Election.findOne({
        groupAdminId: currentUser._id,
        status: 'accepting_candidates',
      });
      if (!election) {
        return sendErrorResponse(
          res,
          404,
          'No election in accepting_candidates state to start.'
        );
      }

      if (!election.candidates || election.candidates.length === 0) {
        return sendErrorResponse(
          res,
          400,
          'At least one member must have applied as candidate before starting.'
        );
      }

      election.status = 'voting';
      election.startedAt = new Date();
      await election.save();

      const populated = await Election.findById(election._id)
        .populate('candidates.userId', 'name email');

      return sendSuccessResponse(
        res,
        200,
        'Election started. Members can now vote for a candidate.',
        populated
      );
    } catch (error) {
      logger.error('Error in startElection:', error);
      next(error);
    }
  }

  /**
   * Member casts vote for one candidate (only when status is voting). One vote per member.
   */
  async vote(req, res, next) {
    try {
      const currentUser = req.user;
      const { candidateId } = req.body || {};

      if (currentUser.role !== 'member') {
        return sendErrorResponse(
          res,
          403,
          'Only group members can vote.'
        );
      }
      if (!currentUser.createdBy) {
        return sendErrorResponse(res, 400, 'You are not in a group.');
      }
      if (!candidateId) {
        return sendErrorResponse(res, 400, 'candidateId is required.');
      }

      const election = await Election.findOne({
        groupAdminId: currentUser.createdBy,
        status: 'voting',
      }).populate('candidates.userId', 'name email');
      if (!election) {
        return sendErrorResponse(
          res,
          404,
          'No election in voting phase for your group.'
        );
      }

      const alreadyVoted = election.votes.some(
        v => (v.voterId && (v.voterId._id || v.voterId).toString()) === currentUser._id.toString()
      );
      if (alreadyVoted) {
        return sendErrorResponse(
          res,
          400,
          'You have already voted in this election.'
        );
      }

      const candidateIdStr = String(candidateId);
      const isCandidate = election.candidates.some(c => {
        const id = c.userId && (c.userId._id || c.userId);
        return id && id.toString() === candidateIdStr;
      });
      if (!isCandidate) {
        return sendErrorResponse(
          res,
          400,
          'You can only vote for an approved candidate.'
        );
      }

      election.votes.push({
        voterId: currentUser._id,
        candidateId,
      });
      await election.save();

      const totalMembers = await User.countDocuments({
        role: 'member',
        status: 'active',
        createdBy: election.groupAdminId,
      });
      const votedCount = election.votes.length;
      const remainingVotes = Math.max(0, totalMembers - votedCount);

      if (votedCount >= totalMembers) {
        const voteCountByCandidate = {};
        election.votes.forEach(v => {
          const id = (v.candidateId && (v.candidateId._id || v.candidateId)).toString();
          voteCountByCandidate[id] = (voteCountByCandidate[id] || 0) + 1;
        });
        const unanimousId = Object.keys(voteCountByCandidate).find(
          id => voteCountByCandidate[id] === totalMembers
        );
        if (unanimousId) {
          const candidate = await User.findById(unanimousId).select(
            'role status createdBy'
          );
          const groupAdmin = await User.findById(
            election.groupAdminId
          ).select('role status');
          if (
            candidate &&
            groupAdmin &&
            candidate.status === 'active' &&
            groupAdmin.status === 'active'
          ) {
            const completedAt = new Date();
            const updated = await Election.findOneAndUpdate(
              { _id: election._id, status: 'voting' },
              {
                $set: {
                  status: 'completed',
                  completedAt,
                  newAdminId: candidate._id,
                },
              },
              { new: true }
            );
            if (updated) {
              await User.updateMany(
                {
                  createdBy: election.groupAdminId,
                  _id: { $ne: candidate._id },
                },
                { $set: { createdBy: candidate._id } }
              );
              await User.updateOne(
                { _id: election.groupAdminId },
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
            }
          }
        }
      }

      const updated = await Election.findById(election._id)
        .populate('candidates.userId', 'name email')
        .populate('votes.voterId', 'name email')
        .populate('votes.candidateId', 'name email');

      return sendSuccessResponse(res, 200, 'Vote recorded.', {
        election: updated,
        totalMembers,
        votedCount,
        remainingVotes,
      });
    } catch (error) {
      logger.error('Error in vote (election):', error);
      next(error);
    }
  }

  /**
   * Admin cancels the current election (accepting_candidates or voting).
   */
  async cancelElection(req, res, next) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== 'admin') {
        return sendErrorResponse(
          res,
          403,
          'Only the group admin can cancel the election.'
        );
      }

      const election = await Election.findOneAndUpdate(
        {
          groupAdminId: currentUser._id,
          status: { $in: ['accepting_candidates', 'voting'] },
        },
        { status: 'cancelled' },
        { new: true }
      );

      if (!election) {
        return sendErrorResponse(
          res,
          404,
          'No active election to cancel.'
        );
      }

      return sendSuccessResponse(
        res,
        200,
        'Election cancelled.',
        { electionId: election._id }
      );
    } catch (error) {
      logger.error('Error in cancelElection:', error);
      next(error);
    }
  }
}

module.exports = new GroupElectionController();
