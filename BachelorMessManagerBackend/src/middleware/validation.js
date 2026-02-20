const { body, query, param, validationResult } = require('express-validator');
const Joi = require('joi');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  handleValidationErrors,
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Meal submission validation
const validateMealSubmission = [
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('breakfast')
    .optional()
    .isBoolean()
    .withMessage('Breakfast must be a boolean'),
  body('lunch').optional().isBoolean().withMessage('Lunch must be a boolean'),
  body('dinner').optional().isBoolean().withMessage('Dinner must be a boolean'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('guestBreakfast').optional().isInt({ min: 0, max: 99 }).withMessage('Guest breakfast must be between 0 and 99'),
  body('guestLunch').optional().isInt({ min: 0, max: 99 }).withMessage('Guest lunch must be between 0 and 99'),
  body('guestDinner').optional().isInt({ min: 0, max: 99 }).withMessage('Guest dinner must be between 0 and 99'),
  handleValidationErrors,
];

// Bazar submission validation
const validateBazarSubmission = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('items.*.quantity')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50 characters'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date').isISO8601().withMessage('Please provide a valid date'),
  handleValidationErrors,
];

// Status update validation
const validateStatusUpdate = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  handleValidationErrors,
];

// User creation/update validation
const validateUserData = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  handleValidationErrors,
];

// User creation validation (admin only)
const validateUserCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  handleValidationErrors,
];

// User update validation (admin only)
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  handleValidationErrors,
];

// Profile update validation (current user)
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters long'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (req.body.newPassword && value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors,
];

// Query parameter validation
const validateQueryParams = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('timeframe')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Timeframe must be week, month, or year'),
  handleValidationErrors,
];

// ObjectId validation
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

// Joi schemas for complex validation
const mealSchema = Joi.object({
  date: Joi.date().iso().required(),
  breakfast: Joi.boolean().default(false),
  lunch: Joi.boolean().default(false),
  dinner: Joi.boolean().default(false),
  notes: Joi.string().max(500).optional(),
  guestBreakfast: Joi.number().integer().min(0).max(99).optional(),
  guestLunch: Joi.number().integer().min(0).max(99).optional(),
  guestDinner: Joi.number().integer().min(0).max(99).optional(),
});

const bazarSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(100).required(),
        quantity: Joi.string().min(1).max(50).required(),
        price: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
  totalAmount: Joi.number().positive().required(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().iso().required(),
});

// Joi validation middleware
const validateWithJoi = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    req.body = value;
    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateMealSubmission,
  validateBazarSubmission,
  validateStatusUpdate,
  validateUserData,
  validateUserCreation,
  validateUserUpdate,
  validateProfileUpdate,
  validateQueryParams,
  validateObjectId,
  validateWithJoi,
  mealSchema,
  bazarSchema,
};
