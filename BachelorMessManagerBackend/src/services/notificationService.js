/**
 * notificationService — thin utility for creating notifications from controllers.
 * All notification creation goes through this single function so that
 * failures never crash the originating request (fire-and-forget).
 * Pushes to connected clients via centralized socket hub (channel: notification).
 */
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const socketHub = require('../ws/socketHub');
const { NOTIFICATION } = require('../ws/channels');

/**
 * Create a notification for one or more users.
 * @param {string|string[]} userIds  - Recipient user ID(s)
 * @param {string}  type             - Notification type (see Notification model enum)
 * @param {string}  title            - Short title
 * @param {string}  message          - Full message body
 * @param {Object}  [ref]            - Optional { refType, refId } back-reference
 * @returns {Promise<void>}          - Resolves after insert; errors are logged, not thrown
 */
async function createNotification(userIds, type, title, message, ref = {}) {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (!ids.length) return;

    const docs = ids.map(userId => ({
      userId,
      type,
      title,
      message,
      isRead: false,
      refType: ref.refType ?? undefined,
      refId: ref.refId ?? undefined,
    }));

    const result = await Notification.insertMany(docs, { ordered: false });
    if (socketHub.isAvailable() && result.insertedIds) {
      const insertedIds = Array.isArray(result.insertedIds)
        ? result.insertedIds
        : Object.values(result.insertedIds);
      const inserted = await Notification.find({ _id: { $in: insertedIds } }).lean();
      for (const doc of inserted) {
        const userIdStr = String(doc.userId);
        const unreadCount = await Notification.countDocuments({ userId: doc.userId, isRead: false });
        const data = {
          _id: String(doc._id),
          userId: userIdStr,
          type: doc.type,
          title: doc.title,
          message: doc.message,
          isRead: doc.isRead,
          refType: doc.refType,
          refId: doc.refId ? String(doc.refId) : undefined,
          createdAt: doc.createdAt?.toISOString?.(),
          updatedAt: doc.updatedAt?.toISOString?.(),
          unreadCount,
        };
        socketHub.pushToChannel(userIdStr, NOTIFICATION, data);
      }
    }
  } catch (err) {
    logger.warn('notificationService.createNotification failed', { type, error: err?.message });
  }
}

/**
 * Get notifications for a user (paginated).
 */
async function getNotificationsForUser(userId, { page = 1, limit = 30 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, limit };
}

/**
 * Get just the unread count (lightweight — for badge polling).
 */
async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

/**
 * Mark a single notification as read.
 */
async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );
}

/**
 * Mark all of a user's notifications as read.
 */
async function markAllAsRead(userId) {
  return Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
