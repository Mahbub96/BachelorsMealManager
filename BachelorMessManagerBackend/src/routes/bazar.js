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

// @desc    Get user bazar entries (alternative endpoint)
// @route   GET /api/bazar/user
// @access  Private
router.get('/user', AuthMiddleware.protect(), bazarController.getUserBazar);

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

// ===== ADMIN OVERRIDE ROUTES =====

// @desc    Admin override: Create bazar entry for any user (admin only)
// @route   POST /api/bazar/admin/create
// @access  Private/Admin
router.post(
  '/admin/create',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  uploadMiddleware,
  bazarController.createBazarForUser
);

// @desc    Admin override: Update any bazar entry (admin only)
// @route   PUT /api/bazar/admin/:bazarId
// @access  Private/Admin
router.put(
  '/admin/:bazarId',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.adminUpdateBazar
);

// @desc    Admin override: Delete any bazar entry (admin only)
// @route   DELETE /api/bazar/admin/:bazarId
// @access  Private/Admin
router.delete(
  '/admin/:bazarId',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.adminDeleteBazar
);

// @desc    Admin override: Bulk operations (admin only)
// @route   POST /api/bazar/admin/bulk
// @access  Private/Admin
router.post(
  '/admin/bulk',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  bazarController.adminBulkOperations
);

module.exports = router;
