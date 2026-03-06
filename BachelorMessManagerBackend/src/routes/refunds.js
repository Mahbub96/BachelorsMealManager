const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const refundController = require('../controllers/refundController');

router.post('/', protect, refundController.sendRefund);
router.get('/', protect, refundController.listRefunds);
router.post('/:id/acknowledge', protect, refundController.acknowledgeRefund);

module.exports = router;
