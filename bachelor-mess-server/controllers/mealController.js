const Meal = require("../models/Meal");
const User = require("../models/User");

// Submit daily meals
exports.submitMeals = async (req, res) => {
  try {
    const { breakfast, lunch, dinner, date, notes } = req.body;
    const userId = req.user.id;

    // Check if meal entry already exists for this date
    const existingMeal = await Meal.findOne({
      userId,
      date: new Date(date || Date.now()).toISOString().split("T")[0],
    });

    if (existingMeal) {
      return res.status(400).json({
        message: "Meal entry already exists for this date",
      });
    }

    const meal = new Meal({
      userId,
      date: date || new Date(),
      breakfast: breakfast || false,
      lunch: lunch || false,
      dinner: dinner || false,
      notes,
    });

    await meal.save();

    res.status(201).json({
      message: "Meals submitted successfully",
      meal,
    });
  } catch (error) {
    console.error("Submit meals error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user's meals
exports.getUserMeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    let query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    }

    const meals = await Meal.find(query)
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 10);

    res.status(200).json(meals);
  } catch (error) {
    console.error("Get user meals error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all meals (admin only)
exports.getAllMeals = async (req, res) => {
  try {
    const { status, startDate, endDate, userId } = req.query;

    let query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const meals = await Meal.find(query)
      .populate("userId", "name email")
      .populate("approvedBy", "name")
      .sort({ date: -1 });

    res.status(200).json(meals);
  } catch (error) {
    console.error("Get all meals error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Approve/reject meal (admin only)
exports.updateMealStatus = async (req, res) => {
  try {
    const { mealId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    meal.status = status;
    meal.notes = notes;
    meal.approvedBy = adminId;
    meal.approvedAt = new Date();

    await meal.save();

    res.status(200).json({
      message: `Meal ${status} successfully`,
      meal,
    });
  } catch (error) {
    console.error("Update meal status error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get meal statistics
exports.getMealStats = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (userId) query.userId = userId;

    const stats = await Meal.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBreakfast: { $sum: { $cond: ["$breakfast", 1, 0] } },
          totalLunch: { $sum: { $cond: ["$lunch", 1, 0] } },
          totalDinner: { $sum: { $cond: ["$dinner", 1, 0] } },
          totalMeals: {
            $sum: {
              $add: [
                { $cond: ["$breakfast", 1, 0] },
                { $cond: ["$lunch", 1, 0] },
                { $cond: ["$dinner", 1, 0] },
              ],
            },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json(
      stats[0] || {
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        totalMeals: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      }
    );
  } catch (error) {
    console.error("Get meal stats error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
