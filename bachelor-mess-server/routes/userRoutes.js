const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getProfile,
  updateProfile,
} = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Profile routes (for current user)
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Admin routes - specific routes first
router.get("/all", verifyToken, isAdmin, getAllUsers);
router.post("/create", verifyToken, isAdmin, createUser);

// Parameterized routes last
router.get("/:userId", verifyToken, isAdmin, getUserById);
router.put("/:userId", verifyToken, isAdmin, updateUser);
router.delete("/:userId", verifyToken, isAdmin, deleteUser);
router.get("/:userId/stats", verifyToken, isAdmin, getUserStats);

module.exports = router;
