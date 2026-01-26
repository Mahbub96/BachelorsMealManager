const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const AuthMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
const { validateObjectId } = require('../middleware/validation');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, userController.getUserProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, userController.updateUserProfile);

// @desc    Get user statistics
// @route   GET /api/users/stats/:userId
// @access  Private
router.get('/stats/:userId', protect, userController.getUserStats);

// @desc    Get current user statistics
// @route   GET /api/users/stats/current
// @access  Private
router.get('/stats/current', protect, userController.getCurrentUserStats);

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, userController.getUserDashboard);

// @desc    Get all users (for admins)
// @route   GET /api/users
// @access  Private (Admin/Super Admin only)
router.get('/', protect, AuthMiddleware.requireRole(['admin', 'super_admin']), userController.getAllUsers);

// @desc    Create user (for admins)
// @route   POST /api/users
// @access  Private (Admin/Super Admin only)
router.post('/', protect, AuthMiddleware.requireRole(['admin', 'super_admin']), userController.createUser);

// @desc    Update user (for admins)
// @route   PUT /api/users/:id
// @access  Private (Admin/Super Admin only)
router.put('/:id', protect, AuthMiddleware.requireRole(['admin', 'super_admin']), userController.updateUser);

// @desc    Delete user (for admins)
// @route   DELETE /api/users/:id
// @access  Private (Admin/Super Admin only)
router.delete('/:id', protect, AuthMiddleware.requireRole(['admin', 'super_admin']), userController.deleteUser);

// @desc    Reset user password (for admins)
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin/Super Admin only)
router.post('/:id/reset-password', protect, validateObjectId, AuthMiddleware.requireRole(['admin', 'super_admin']), userController.resetUserPassword);

module.exports = router;
