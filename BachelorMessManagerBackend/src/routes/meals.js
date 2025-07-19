const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const { validateMealSubmission } = require('../middleware/validation');
const mealController = require('../controllers/mealController');

// @desc    Submit daily meals
// @route   POST /api/meals
// @access  Private
router.post(
  '/',
  AuthMiddleware.protect(),
  validateMealSubmission,
  mealController.submitMeals
);

// @desc    Submit daily meals (alternative endpoint)
// @route   POST /api/meals/submit
// @access  Private
router.post(
  '/submit',
  AuthMiddleware.protect(),
  validateMealSubmission,
  mealController.submitMeals
);

// @desc    Get user meals
// @route   GET /api/meals
// @access  Private
router.get('/', AuthMiddleware.protect(), mealController.getUserMeals);

// @desc    Get user meals (alternative endpoint)
// @route   GET /api/meals/user
// @access  Private
router.get('/user', AuthMiddleware.protect(), mealController.getUserMeals);

// @desc    Get all meals (admin only)
// @route   GET /api/meals/all
// @access  Private/Admin
router.get(
  '/all',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  mealController.getAllMeals
);

// @desc    Get meal by ID
// @route   GET /api/meals/:mealId
// @access  Private
router.get('/:mealId', AuthMiddleware.protect(), mealController.getMealById);

// @desc    Update meal entry
// @route   PUT /api/meals/:mealId
// @access  Private
router.put('/:mealId', AuthMiddleware.protect(), mealController.updateMeal);

// @desc    Update meal status (admin only)
// @route   PATCH /api/meals/:mealId/status
// @access  Private/Admin
router.patch(
  '/:mealId/status',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  mealController.updateMealStatus
);

// @desc    Delete meal entry
// @route   DELETE /api/meals/:mealId
// @access  Private
router.delete('/:mealId', AuthMiddleware.protect(), mealController.deleteMeal);

// @desc    Get meal statistics
// @route   GET /api/meals/stats/overview
// @access  Private/Admin
router.get(
  '/stats/overview',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  mealController.getMealStats
);

// @desc    Get user meal statistics
// @route   GET /api/meals/stats/user
// @access  Private
router.get(
  '/stats/user',
  AuthMiddleware.protect(),
  mealController.getUserMealStats
);

// @desc    Bulk approve meals (admin only)
// @route   POST /api/meals/bulk-approve
// @access  Private/Admin
router.post(
  '/bulk-approve',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  mealController.bulkApproveMeals
);

module.exports = router;
