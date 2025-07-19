const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const {
  validateUserCreation,
  validateUserUpdate,
  validateProfileUpdate,
} = require('../middleware/validation');
const userController = require('../controllers/userController');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get(
  '/',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.getAllUsers
);

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get(
  '/profile',
  AuthMiddleware.protect(),
  userController.getCurrentUserProfile
);

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
router.put(
  '/profile',
  AuthMiddleware.protect(),
  validateProfileUpdate,
  userController.updateCurrentUserProfile
);

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:userId
// @access  Private/Admin
router.get(
  '/:userId',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.getUserById
);

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
router.post(
  '/',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  validateUserCreation,
  userController.createUser
);

// @desc    Update user (admin only)
// @route   PUT /api/users/:userId
// @access  Private/Admin
router.put(
  '/:userId',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  validateUserUpdate,
  userController.updateUser
);

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:userId
// @access  Private/Admin
router.delete(
  '/:userId',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.deleteUser
);

// @desc    Get user statistics (admin only)
// @route   GET /api/users/:userId/stats
// @access  Private/Admin
router.get(
  '/:userId/stats',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.getUserStats
);

// @desc    Change user status (admin only)
// @route   PATCH /api/users/:userId/status
// @access  Private/Admin
router.patch(
  '/:userId/status',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.changeUserStatus
);

// @desc    Change user role (admin only)
// @route   PATCH /api/users/:userId/role
// @access  Private/Admin
router.patch(
  '/:userId/role',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.changeUserRole
);

// @desc    Get user activity (admin only)
// @route   GET /api/users/:userId/activity
// @access  Private/Admin
router.get(
  '/:userId/activity',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.getUserActivity
);

// @desc    Bulk update users (admin only)
// @route   PUT /api/users/bulk-update
// @access  Private/Admin
router.put(
  '/bulk-update',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.bulkUpdateUsers
);

// @desc    Get system statistics (admin only)
// @route   GET /api/users/stats/system
// @access  Private/Admin
router.get(
  '/stats/system',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.getSystemStats
);

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private/Admin
router.get(
  '/search',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  userController.searchUsers
);

module.exports = router;
