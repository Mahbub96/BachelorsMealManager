const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('./logger');

/**
 * Get group member IDs for the current user.
 * - Admin: [adminId, ...members where createdBy = adminId]
 * - Member: [createdBy (admin), ...members where createdBy = same admin]
 * - Super_admin or no group: null (caller uses single-user scope)
 * @param {Object} user - req.user (must have _id, role, createdBy)
 * @returns {Promise<mongoose.Types.ObjectId[] | null>}
 */
async function getGroupMemberIds(user) {
  if (!user || !user._id) return null;
  const userId = user._id instanceof mongoose.Types.ObjectId ? user._id : new mongoose.Types.ObjectId(user._id);

  // Super admin: no group scope (keep app-wide or single-user as per existing behavior)
  if (user.role === 'super_admin') return null;

  if (user.role === 'admin') {
    const memberIds = await User.find({ createdBy: userId, status: 'active' })
      .select('_id')
      .lean();
    const ids = [userId, ...memberIds.map((m) => m._id)];
    logger.debug('Group member IDs (admin)', { adminId: userId.toString(), count: ids.length });
    return ids;
  }

  if (user.role === 'member' && user.createdBy) {
    const adminId = user.createdBy instanceof mongoose.Types.ObjectId
      ? user.createdBy
      : new mongoose.Types.ObjectId(user.createdBy);
    const memberIds = await User.find({ createdBy: adminId, status: 'active' })
      .select('_id')
      .lean();
    const ids = [adminId, ...memberIds.map((m) => m._id)];
    logger.debug('Group member IDs (member)', { adminId: adminId.toString(), count: ids.length });
    return ids;
  }

  return null;
}

module.exports = { getGroupMemberIds };
