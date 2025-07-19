const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateMealSubmission } = require('../middleware/validation');
const mealController = require('../controllers/mealController');

// @desc    Submit daily meals
// @route   POST /api/meals
// @access  Private
router.post('/', protect, validateMealSubmission, mealController.submitMeals);

// @desc    Get user meals
// @route   GET /api/meals
// @access  Private
router.get('/', protect, mealController.getUserMeals);

// @desc    Get all meals (admin only)
// @route   GET /api/meals/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), mealController.getAllMeals);

// @desc    Get meal by ID
// @route   GET /api/meals/:mealId
// @access  Private
router.get('/:mealId', protect, mealController.getMealById);

// @desc    Update meal entry
// @route   PUT /api/meals/:mealId
// @access  Private
router.put('/:mealId', protect, mealController.updateMeal);

// @desc    Update meal status (admin only)
// @route   PATCH /api/meals/:mealId/status
// @access  Private/Admin
router.patch('/:mealId/status', protect, authorize('admin'), mealController.updateMealStatus);

// @desc    Delete meal entry
// @route   DELETE /api/meals/:mealId
// @access  Private
router.delete('/:mealId', protect, mealController.deleteMeal);

// @desc    Get meal statistics
// @route   GET /api/meals/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), mealController.getMealStats);

// @desc    Get user meal statistics
// @route   GET /api/meals/stats/user
// @access  Private
router.get('/stats/user', protect, mealController.getUserMealStats);

// @desc    Bulk approve meals (admin only)
// @route   POST /api/meals/bulk-approve
// @access  Private/Admin
router.post('/bulk-approve', protect, authorize('admin'), mealController.bulkApproveMeals);

module.exports = router; 