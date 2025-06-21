const express = require("express");
const {
  submitMeals,
  getUserMeals,
  getAllMeals,
  updateMealStatus,
  getMealStats,
} = require("../controllers/mealController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Member routes
router.post("/submit", verifyToken, submitMeals);
router.get("/user", verifyToken, getUserMeals);

// Admin routes
router.get("/all", verifyToken, isAdmin, getAllMeals);
router.put("/:mealId/status", verifyToken, isAdmin, updateMealStatus);
router.get("/stats", verifyToken, isAdmin, getMealStats);

module.exports = router;
