const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const userController = require('../controllers/userController');
const paymentController = require('../controllers/paymentController');
const logger = require('../utils/logger');

function normalizeUserId(req, res) {
  let userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    res.status(400).json({ success: false, error: 'User context missing' });
    return null;
  }
  if (typeof userId === 'string') {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user context' });
      return null;
    }
    userId = new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

/** POST /api/payments - Record a payment (direct, adds to user paymentHistory) */
router.post('/', protect, async (req, res) => {
  try {
    const userId = normalizeUserId(req, res);
    if (!userId) return;

    const entry = await userController.recordPayment(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Payment recorded',
      data: entry,
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (err.message === 'Invalid amount') {
      return res.status(400).json({ success: false, error: err.message });
    }
    logger.error('Error recording payment:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment',
    });
  }
});

/** POST /api/payments/request - Create payment request (full_due or custom amount) */
router.post('/request', protect, paymentController.createRequest);

/** GET /api/payments/requests - List requests (member: own; admin: group). Query: ?status=pending|approved|rejected */
router.get('/requests', protect, paymentController.getRequests);

/** GET /api/payments/dues - Admin: dues overview for all group members */
router.get('/dues', protect, paymentController.getDuesOverview);

/** POST /api/payments/requests/:id/approve - Admin: confirm received and record payment */
router.post('/requests/:id/approve', protect, paymentController.approveRequest);

/** POST /api/payments/requests/:id/reject - Admin: reject request. Body: { rejectionNote? } */
router.post('/requests/:id/reject', protect, paymentController.rejectRequest);

module.exports = router;
