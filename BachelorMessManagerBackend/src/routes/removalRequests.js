const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const { validateObjectId } = require('../middleware/validation');
const removalRequestController = require('../controllers/removalRequestController');

router.post('/', protect, removalRequestController.create);
router.get('/', protect, removalRequestController.list);
router.post('/:id/accept', protect, validateObjectId, removalRequestController.accept);
router.post('/:id/reject', protect, validateObjectId, removalRequestController.reject);

module.exports = router;
