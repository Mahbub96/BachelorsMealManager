const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const ctrl = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

router.get('/',                  ctrl.listNotifications);
router.get('/unread-count',      ctrl.getUnreadCount);
router.post('/read-all',         ctrl.markAllAsRead);
router.post('/:id/read',         ctrl.markAsRead);

module.exports = router;
