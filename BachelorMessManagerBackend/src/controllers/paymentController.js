const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');
const mongoose = require('mongoose');
const userController = require('./userController');
const { getGroupMemberIds } = require('../utils/groupHelper');
const settlementService = require('../services/settlementService');
const ledgerService = require('../services/ledgerService');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

function normalizeUserId(req, res) {
  let userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    res.status(400).json({ success: false, error: 'User context missing' });
    return null;
  }
  if (typeof userId === 'string') {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user context' });
      return null;
    }
    userId = new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

/**
 * Create a payment request (member: full_due or custom amount).
 */
async function createRequest(req, res) {
  try {
    const userId = normalizeUserId(req, res);
    if (!userId) return;

    const { type = 'custom', amount: rawAmount, method = 'cash', notes } = req.body || {};

    if (!['full_due', 'custom'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type; use full_due or custom' });
    }

    let amount;
    if (type === 'full_due') {
      let due = 0;
      try {
        const settlement = await settlementService.getCurrentMonthSettlementForUser(req.user);
        due = settlement?.due ?? 0;
      } catch (e) {
        const stats = await userController.getPaymentStats(userId);
        due = Math.max(0, stats.monthlyContribution - stats.totalPaid);
      }
      if (due <= 0) {
        return res.status(400).json({
          success: false,
          error: 'No due amount; you are already paid up for this month.',
        });
      }
      amount = due;
    } else {
      const num = Number(rawAmount);
      if (!Number.isFinite(num) || num <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount for custom payment' });
      }
      amount = num;
    }

    const allowedMethods = ['cash', 'bank_transfer', 'mobile_banking'];
    const payMethod = allowedMethods.includes(method) ? method : 'cash';

    const doc = await PaymentRequest.create({
      userId,
      amount,
      type,
      status: 'pending',
      method: payMethod,
      notes: notes ? String(notes).trim().slice(0, 500) : undefined,
    });

    const data = doc.toObject ? doc.toObject() : doc;

    // Notify admin: a member submitted a payment request
    try {
      const member = await User.findById(userId).select('name createdBy').lean();
      const adminId = member?.createdBy;
      if (adminId) {
        notificationService.createNotification(
          adminId,
          'payment_requested',
          'New Payment Request',
          `${member?.name || 'A member'} submitted a ৳${amount} payment request.`,
          { refType: 'PaymentRequest', refId: doc._id }
        );
      }
    } catch { /* non-critical */ }

    res.status(201).json({ success: true, message: 'Payment request created', data });
  } catch (err) {
    logger.error('createRequest error:', err);
    res.status(500).json({ success: false, error: 'Failed to create payment request' });
  }
}

/**
 * List payment requests: member = own; admin = all group members'.
 */
async function getRequests(req, res) {
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

    const status = req.query.status; // optional filter: pending | approved | rejected
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const list = await PaymentRequest.find(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ requestedAt: -1 })
      .lean();

    const data = list.map((r) => ({
      id: r._id,
      userId: r.userId?._id || r.userId,
      userName: r.userId?.name,
      userEmail: r.userId?.email,
      amount: r.amount,
      type: r.type,
      status: r.status,
      method: r.method,
      notes: r.notes,
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
      approvedBy: r.approvedBy?.name,
      rejectionNote: r.rejectionNote,
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error('getRequests error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payment requests' });
  }
}

/**
 * Admin: approve a payment request → add to user's paymentHistory and mark request approved.
 */
async function approveRequest(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const role = req.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const requestId = req.params.id;
    const [pr, groupMemberIds] = await Promise.all([
      PaymentRequest.findById(requestId),
      getGroupMemberIds(req.user),
    ]);
    if (!pr) {
      return res.status(404).json({ success: false, error: 'Payment request not found' });
    }
    if (pr.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    const inGroup =
      Array.isArray(groupMemberIds) &&
      groupMemberIds.some((id) => id && id.toString() === pr.userId.toString());
    if (!inGroup && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Not in your group' });
    }

    await userController.recordPayment(pr.userId, {
      amount: pr.amount,
      method: pr.method || 'cash',
      notes: pr.notes ? `Payment request #${requestId}` : undefined,
    });

    pr.status = 'approved';
    pr.approvedAt = new Date();
    pr.approvedBy = currentUserId;
    await pr.save();

    await ledgerService.createEntry(req.user, {
      userId: pr.userId,
      type: 'payment_recorded',
      amount: pr.amount,
      refType: 'PaymentRequest',
      refId: pr._id,
      description: `Payment approved: ৳${pr.amount}`,
    });

    const data = pr.toObject ? pr.toObject() : pr;

    // Notify the member: payment was approved
    notificationService.createNotification(
      pr.userId,
      'payment_approved',
      'Payment Approved ✅',
      `Your ৳${pr.amount} payment request has been approved.`,
      { refType: 'PaymentRequest', refId: pr._id }
    );

    res.json({ success: true, message: 'Payment confirmed and recorded', data });
  } catch (err) {
    logger.error('approveRequest error:', err);
    res.status(500).json({ success: false, error: 'Failed to approve request' });
  }
}

/**
 * Admin: reject a payment request.
 */
async function rejectRequest(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const role = req.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const requestId = req.params.id;
    const [pr, groupMemberIds] = await Promise.all([
      PaymentRequest.findById(requestId),
      getGroupMemberIds(req.user),
    ]);
    if (!pr) {
      return res.status(404).json({ success: false, error: 'Payment request not found' });
    }
    if (pr.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    const inGroup =
      Array.isArray(groupMemberIds) &&
      groupMemberIds.some((id) => id && id.toString() === pr.userId.toString());
    if (!inGroup && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Not in your group' });
    }

    const { rejectionNote } = req.body || {};
    pr.status = 'rejected';
    pr.rejectionNote = rejectionNote ? String(rejectionNote).trim().slice(0, 500) : undefined;
    await pr.save();

    const data = pr.toObject ? pr.toObject() : pr;

    // Notify the member: payment was rejected
    notificationService.createNotification(
      pr.userId,
      'payment_rejected',
      'Payment Request Rejected',
      `Your ৳${pr.amount} payment request was rejected.${rejectionNote ? ` Reason: ${rejectionNote}` : ''}`,
      { refType: 'PaymentRequest', refId: pr._id }
    );

    res.json({ success: true, message: 'Payment request rejected', data });
  } catch (err) {
    logger.error('rejectRequest error:', err);
    res.status(500).json({ success: false, error: 'Failed to reject request' });
  }
}

/**
 * Admin: get dues overview for all group members (settlement-based: due/receive from meal rate + flat share).
 */
async function getDuesOverview(req, res) {
  try {
    const currentUserId = normalizeUserId(req, res);
    if (!currentUserId) return;

    const role = req.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { summary, members } = await settlementService.getCurrentMonthSettlementForGroup(req.user);

    const pendingCounts = await PaymentRequest
      .aggregate([
        { $match: { userId: { $in: members.map((m) => m.userId) }, status: 'pending' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]);
    const pendingByUser = {};
    pendingCounts.forEach((p) => {
      pendingByUser[p._id.toString()] = p.count;
    });

    const data = members.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      monthlyContribution: summary.flatSharePerPerson + (m.mealCost || 0),
      totalPaid: (m.mealBazarPaid || 0) + (m.flatBazarPaid || 0) + (m.paymentsTotal || 0),
      due: m.due,
      receive: m.receive,
      balance: m.balance,
      paymentStatus: m.due > 0 ? 'pending' : m.receive > 0 ? 'refund_due' : 'paid',
      lastPaymentDate: null,
      pendingRequestsCount: pendingByUser[m.userId.toString()] || 0,
    }));

    res.json({ success: true, data, summary });
  } catch (err) {
    logger.error('getDuesOverview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dues overview' });
  }
}

module.exports = {
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  getDuesOverview,
};
