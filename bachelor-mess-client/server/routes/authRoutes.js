// Placeholder for Auth Routes
const express = require('express');
const { register, login } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Protect routes
router.get('/admin-only', verifyToken, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Welcome Admin!' });
});

module.exports = router;
