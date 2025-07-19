const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const { validateBazarSubmission } = require('../middleware/validation');
const { uploadMiddleware } = require('../middleware/upload');
const bazarController = require('../controllers/bazarController');

// @desc    Submit bazar entry
// @route   POST /api/bazar
// @access  Private
router.post(
  '/',
  AuthMiddleware.protect(),
  uploadMiddleware,
  validateBazarSubmission,
  bazarController.submitBazar
);

// @desc    Get user bazar entries
// @route   GET /api/bazar
// @access  Private
router.get('/', AuthMiddleware.protect(), bazarController.getUserBazar);

// @desc    Get all bazar entries (admin only)
// @route   GET /api/bazar/all
// @access  Private/Admin
router.get(
  '/all',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.getAllBazar
);

// @desc    Get bazar by ID
// @route   GET /api/bazar/:bazarId
// @access  Private
router.get('/:bazarId', AuthMiddleware.protect(), bazarController.getBazarById);

// @desc    Update bazar entry
// @route   PUT /api/bazar/:bazarId
// @access  Private
router.put('/:bazarId', AuthMiddleware.protect(), bazarController.updateBazar);

// @desc    Update bazar status (admin only)
// @route   PATCH /api/bazar/:bazarId/status
// @access  Private/Admin
router.patch(
  '/:bazarId/status',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.updateBazarStatus
);

// @desc    Delete bazar entry
// @route   DELETE /api/bazar/:bazarId
// @access  Private
router.delete(
  '/:bazarId',
  AuthMiddleware.protect(),
  bazarController.deleteBazar
);

// @desc    Get bazar statistics
// @route   GET /api/bazar/stats/overview
// @access  Private/Admin
router.get(
  '/stats/overview',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.getBazarStats
);

// @desc    Get user bazar statistics
// @route   GET /api/bazar/stats/user
// @access  Private
router.get(
  '/stats/user',
  AuthMiddleware.protect(),
  bazarController.getUserBazarStats
);

// @desc    Bulk approve bazar entries (admin only)
// @route   POST /api/bazar/bulk-approve
// @access  Private/Admin
router.post(
  '/bulk-approve',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.bulkApproveBazar
);

// @desc    Get bazar summary by category
// @route   GET /api/bazar/summary/category
// @access  Private/Admin
router.get(
  '/summary/category',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.getBazarSummaryByCategory
);

// @desc    Get bazar trends
// @route   GET /api/bazar/trends
// @access  Private/Admin
router.get(
  '/trends',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.getBazarTrends
);

module.exports = router;
