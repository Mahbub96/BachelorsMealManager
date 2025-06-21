// Auth Routes with complete API integration
const express = require("express");
const { register, login, logout } = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.post("/logout", verifyToken, logout);

// Admin only route
router.get("/admin-only", verifyToken, isAdmin, (req, res) => {
  res.status(200).json({ message: "Welcome Admin!" });
});

module.exports = router;
