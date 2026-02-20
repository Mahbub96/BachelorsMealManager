const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('./logger');

const CACHE_TTL_MS = 5000; // 5 seconds – reduces duplicate User.find when many concurrent requests hit
const groupCache = new Map(); // key: adminId string, value: { ids, expiresAt }

/**
 * Get group member IDs for the current user.
 * - Admin: [adminId, ...members where createdBy = adminId]
 * - Member: [createdBy (admin), ...members where createdBy = same admin]
 * - Super_admin or no group: null (caller uses single-user scope)
 * Results are cached briefly to avoid duplicate User.find on burst of requests.
 * @param {Object} user - req.user (must have _id, role, createdBy)
 * @returns {Promise<mongoose.Types.ObjectId[] | null>}
 */
async function getGroupMemberIds(user) {
  const rawId = user?._id ?? user?.id;
  if (!user || !rawId) return null;
  const userId = rawId instanceof mongoose.Types.ObjectId ? rawId : new mongoose.Types.ObjectId(rawId);

  if (user.role === 'super_admin') return null;

  let cacheKey = null;
  let fetchIds = null;

  if (user.role === 'admin') {
    cacheKey = userId.toString();
    fetchIds = async () => {
      const memberIds = await User.find({ createdBy: userId, status: 'active' })
        .select('_id')
        .lean();
      return [userId, ...memberIds.map((m) => m._id)];
    };
  } else if (user.role === 'member' && user.createdBy) {
    const adminId = user.createdBy instanceof mongoose.Types.ObjectId
      ? user.createdBy
      : new mongoose.Types.ObjectId(user.createdBy);
    cacheKey = adminId.toString();
    fetchIds = async () => {
      const memberIds = await User.find({ createdBy: adminId, status: 'active' })
        .select('_id')
        .lean();
      return [adminId, ...memberIds.map((m) => m._id)];
    };
  } else {
    return null;
  }

  const now = Date.now();
  const cached = groupCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.ids;

  const ids = await fetchIds();
  groupCache.set(cacheKey, { ids, expiresAt: now + CACHE_TTL_MS });
  if (logger.debug) logger.debug('Group member IDs cached', { cacheKey, count: ids.length });
  return ids;
}

module.exports = { getGroupMemberIds };
