const notificationService = require('../services/notificationService');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user.
 */
async function listNotifications(req, res) {
  try {
    const userId = req.user._id;
    if (!userId) {
      return sendErrorResponse(res, 400, 'User ID is required');
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const result = await notificationService.getNotificationsForUser(userId, { page, limit });
    return sendSuccessResponse(res, 200, 'Notifications fetched successfully', result);
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to fetch notifications');
  }
}

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for badge polling.
 */
async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return sendSuccessResponse(res, 200, 'Unread count fetched successfully', { unreadCount: count });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to fetch unread count');
  }
}

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read.
 */
async function markAsRead(req, res) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return sendErrorResponse(res, 404, 'Notification not found');
    }
    return sendSuccessResponse(res, 200, 'Notification marked as read successfully', { notification });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to mark notification as read');
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all of the user's notifications as read.
 */
async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return sendSuccessResponse(res, 200, 'All notifications marked as read successfully', { message: 'All notifications marked as read' });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to mark all notifications as read');
  }
}

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead };
