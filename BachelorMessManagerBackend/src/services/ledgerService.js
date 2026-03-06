const mongoose = require('mongoose');
const LedgerEntry = require('../models/LedgerEntry');
const { getGroupMemberIds } = require('../utils/groupHelper');
const logger = require('../utils/logger');

/**
 * Resolve groupId (admin id of the group) for the current user.
 */
async function resolveGroupId(user) {
  if (!user) return null;
  const uid = user._id ?? user.id;
  if (user.role === 'admin' || user.role === 'super_admin') return uid;
  if (user.role === 'member' && user.createdBy) {
    return user.createdBy instanceof mongoose.Types.ObjectId ? user.createdBy : new mongoose.Types.ObjectId(user.createdBy);
  }
  return uid;
}

/**
 * Create a ledger entry. Call after any financial action.
 * @param {Object} user - req.user
 * @param {Object} opts - { userId, type, amount, refType, refId, description, meta }
 */
async function createEntry(user, opts) {
  try {
    const groupId = await resolveGroupId(user);
    if (!groupId) return null;
    const entry = await LedgerEntry.create({
      groupId,
      userId: opts.userId,
      type: opts.type,
      amount: opts.amount ?? 0,
      refType: opts.refType,
      refId: opts.refId,
      description: opts.description,
      meta: opts.meta,
    });
    return entry;
  } catch (err) {
    logger.error('Ledger createEntry error', err);
    return null;
  }
}

/**
 * Get ledger entries for the user's group (paginated).
 */
async function getGroupLedger(user, page = 1, limit = 50) {
  const groupId = await resolveGroupId(user);
  if (!groupId) return { entries: [], total: 0 };
  const skip = (Math.max(1, page) - 1) * limit;
  const [entries, total] = await Promise.all([
    LedgerEntry.find({ groupId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LedgerEntry.countDocuments({ groupId }),
  ]);
  return { entries, total };
}

module.exports = {
  createEntry,
  getGroupLedger,
  resolveGroupId,
};
