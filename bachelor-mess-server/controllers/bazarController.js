const Bazar = require("../models/Bazar");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Submit bazar entry
exports.submitBazar = async (req, res) => {
  try {
    const { items, totalAmount, description, date } = req.body;
    const userId = req.user.id;
    let receiptImage = null;

    // Handle file upload if present
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "bazar-receipts",
        resource_type: "auto",
      });
      receiptImage = result.secure_url;
    }

    const bazar = new Bazar({
      userId,
      date: date || new Date(),
      items: JSON.parse(items),
      totalAmount,
      description,
      receiptImage,
    });

    await bazar.save();

    res.status(201).json({
      message: "Bazar entry submitted successfully",
      bazar,
    });
  } catch (error) {
    console.error("Submit bazar error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user's bazar entries
exports.getUserBazar = async (req, res) => {
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

    const bazarEntries = await Bazar.find(query)
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 10);

    res.status(200).json(bazarEntries);
  } catch (error) {
    console.error("Get user bazar error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all bazar entries (admin only)
exports.getAllBazar = async (req, res) => {
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

    const bazarEntries = await Bazar.find(query)
      .populate("userId", "name email")
      .populate("approvedBy", "name")
      .sort({ date: -1 });

    res.status(200).json(bazarEntries);
  } catch (error) {
    console.error("Get all bazar error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Approve/reject bazar entry (admin only)
exports.updateBazarStatus = async (req, res) => {
  try {
    const { bazarId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const bazar = await Bazar.findById(bazarId);
    if (!bazar) {
      return res.status(404).json({ message: "Bazar entry not found" });
    }

    bazar.status = status;
    bazar.notes = notes;
    bazar.approvedBy = adminId;
    bazar.approvedAt = new Date();

    await bazar.save();

    res.status(200).json({
      message: `Bazar entry ${status} successfully`,
      bazar,
    });
  } catch (error) {
    console.error("Update bazar status error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get bazar statistics
exports.getBazarStats = async (req, res) => {
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

    const stats = await Bazar.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalEntries: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          averageAmount: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json(
      stats[0] || {
        totalAmount: 0,
        totalEntries: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        averageAmount: 0,
      }
    );
  } catch (error) {
    console.error("Get bazar stats error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
