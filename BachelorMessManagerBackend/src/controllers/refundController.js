const Refund = require('../models/Refund');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getGroupMemberIds } = require('../utils/groupHelper');
const settlementService = require('../services/settlementService');
const ledgerService = require('../services/ledgerService');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

function normalizeUserId(req, res) {
  const userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    res.status(400).json({ success: false, error: 'User context missing' });
    return null;
  }
  return userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
}

/**
 * Admin: create and send a refund to a member (status -> sent).
 */
async function sendRefund(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const role = req.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { memberId, userId: legacyUserId, amount, method = 'cash', notes } = req.body || {};
    const targetUserId = memberId ?? legacyUserId; // support both field names for compatibility
    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'memberId (target member) is required' });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const targetId = targetUserId instanceof mongoose.Types.ObjectId
      ? targetUserId
      : new mongoose.Types.ObjectId(targetUserId);
    const groupMemberIds = await getGroupMemberIds(req.user);
    const inGroup = Array.isArray(groupMemberIds) && groupMemberIds.some((id) => id.toString() === targetId.toString());
    if (!inGroup && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'User not in your group' });
    }

    const { members } = await settlementService.getCurrentMonthSettlementForGroup(req.user);
    const memberSettlement = members.find((m) => m.userId.toString() === targetId.toString());
    const maxRefund = memberSettlement?.receive ?? 0;
    if (numAmount > maxRefund) {
      return res.status(400).json({
        success: false,
        error: `Refund amount cannot exceed receivable (${maxRefund.toFixed(2)} BDT)`,
      });
    }

    const refund = await Refund.create({
      userId: targetId,
      amount: numAmount,
      status: 'sent',
      method: ['cash', 'bank_transfer', 'mobile_banking'].includes(method) ? method : 'cash',
      notes: notes ? String(notes).trim().slice(0, 500) : undefined,
      sentAt: new Date(),
      sentBy: currentUserId,
    });

    await ledgerService.createEntry(req.user, {
      userId: targetId,
      type: 'refund_sent',
      amount: numAmount,
      refType: 'Refund',
      refId: refund._id,
      description: `Refund sent: ৳${numAmount}`,
    });

    const data = refund.toObject ? refund.toObject() : refund;

    // Notify the member: you have a refund waiting
    notificationService.createNotification(
      targetId,
      'refund_sent',
      'Refund Received 💰',
      `Admin sent you a ৳${numAmount} refund via ${method}.`,
      { refType: 'Refund', refId: refund._id }
    );

    res.status(201).json({ success: true, message: 'Refund sent', data });
  } catch (err) {
    logger.error('sendRefund error:', err);
    res.status(500).json({ success: false, error: 'Failed to send refund' });
  }
}

/**
 * List refunds: member = own; admin = all in group.
 */
async function listRefunds(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const role = req.user?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';

    let query = {};
    if (isAdmin) {
      const groupMemberIds = await getGroupMemberIds(req.user);
      if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
        query.userId = { $in: groupMemberIds };
      } else {
        query.userId = currentUserId;
      }
    } else {
      query.userId = currentUserId;
    }

    const status = req.query.status;
    if (status && ['pending_refund', 'sent', 'acknowledged'].includes(status)) {
      query.status = status;
    }

    const list = await Refund.find(query)
      .populate('userId', 'name email')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const data = list.map((r) => ({
      id: r._id,
      userId: r.userId?._id || r.userId,
      userName: r.userId?.name,
      amount: r.amount,
      status: r.status,
      method: r.method,
      notes: r.notes,
      sentAt: r.sentAt,
      sentBy: r.sentBy?.name,
      acknowledgedAt: r.acknowledgedAt,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error('listRefunds error:', err);
    res.status(500).json({ success: false, error: 'Failed to list refunds' });
  }
}

/**
 * Member: acknowledge receiving a refund (status -> acknowledged).
 */
async function acknowledgeRefund(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const refundId = req.params.id;
    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }
    if (refund.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, error: 'Not your refund' });
    }
    if (refund.status !== 'sent') {
      return res.status(400).json({ success: false, error: 'Refund is not in sent status' });
    }

    refund.status = 'acknowledged';
    refund.acknowledgedAt = new Date();
    await refund.save();

    await ledgerService.createEntry(req.user, {
      userId: currentUserId,
      type: 'refund_acknowledged',
      amount: refund.amount,
      refType: 'Refund',
      refId: refund._id,
      description: `Refund acknowledged: ৳${refund.amount}`,
    });

    const data = refund.toObject ? refund.toObject() : refund;

    // Notify the admin: member acknowledged the refund
    try {
      const member = await User.findById(currentUserId).select('name createdBy').lean();
      const adminId = member?.createdBy;
      if (adminId) {
        notificationService.createNotification(
          adminId,
          'refund_acknowledged',
          'Refund Acknowledged ✅',
          `${member?.name || 'A member'} acknowledged the ৳${refund.amount} refund.`,
          { refType: 'Refund', refId: refund._id }
        );
      }
    } catch { /* non-critical */ }

    res.json({ success: true, message: 'Refund acknowledged', data });
  } catch (err) {
    logger.error('acknowledgeRefund error:', err);
    res.status(500).json({ success: false, error: 'Failed to acknowledge refund' });
  }
}

module.exports = {
  sendRefund,
  listRefunds,
  acknowledgeRefund,
};
