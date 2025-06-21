const User = require("../models/User");
const Meal = require("../models/Meal");
const Bazar = require("../models/Bazar");
const bcrypt = require("bcryptjs");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;

    let query = {};

    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "member",
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.status = status !== undefined ? status : user.status;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // First get the user to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get meal statistics
    const mealStats = await Meal.aggregate([
      { $match: { userId: user._id, ...dateQuery } },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: { $add: ["$breakfast", "$lunch", "$dinner"] } },
          totalBreakfast: { $sum: { $cond: ["$breakfast", 1, 0] } },
          totalLunch: { $sum: { $cond: ["$lunch", 1, 0] } },
          totalDinner: { $sum: { $cond: ["$dinner", 1, 0] } },
        },
      },
    ]);

    // Get bazar statistics
    const bazarStats = await Bazar.aggregate([
      { $match: { userId: user._id, ...dateQuery } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalEntries: { $sum: 1 },
          averageAmount: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      mealStats: mealStats[0] || {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
      },
      bazarStats: bazarStats[0] || {
        totalAmount: 0,
        totalEntries: 0,
        averageAmount: 0,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
