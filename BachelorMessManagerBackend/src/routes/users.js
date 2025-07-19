const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateUserCreation, validateUserUpdate } = require('../middleware/validation');
const userController = require('../controllers/userController');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), userController.getAllUsers);

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:userId
// @access  Private/Admin
router.get('/:userId', protect, authorize('admin'), userController.getUserById);

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
router.post('/', protect, authorize('admin'), validateUserCreation, userController.createUser);

// @desc    Update user (admin only)
// @route   PUT /api/users/:userId
// @access  Private/Admin
router.put('/:userId', protect, authorize('admin'), validateUserUpdate, userController.updateUser);

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:userId
// @access  Private/Admin
router.delete('/:userId', protect, authorize('admin'), userController.deleteUser);

// @desc    Get user statistics (admin only)
// @route   GET /api/users/:userId/stats
// @access  Private/Admin
router.get('/:userId/stats', protect, authorize('admin'), userController.getUserStats);

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, userController.getCurrentUserProfile);

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, userController.updateCurrentUserProfile);

// @desc    Change user status (admin only)
// @route   PATCH /api/users/:userId/status
// @access  Private/Admin
router.patch('/:userId/status', protect, authorize('admin'), userController.changeUserStatus);

// @desc    Change user role (admin only)
// @route   PATCH /api/users/:userId/role
// @access  Private/Admin
router.patch('/:userId/role', protect, authorize('admin'), userController.changeUserRole);

// @desc    Get user activity (admin only)
// @route   GET /api/users/:userId/activity
// @access  Private/Admin
router.get('/:userId/activity', protect, authorize('admin'), userController.getUserActivity);

// @desc    Bulk update users (admin only)
// @route   PUT /api/users/bulk-update
// @access  Private/Admin
router.put('/bulk-update', protect, authorize('admin'), userController.bulkUpdateUsers);

// @desc    Get system statistics (admin only)
// @route   GET /api/users/stats/system
// @access  Private/Admin
router.get('/stats/system', protect, authorize('admin'), userController.getSystemStats);

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private/Admin
router.get('/search', protect, authorize('admin'), userController.searchUsers);

module.exports = router; 