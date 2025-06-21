const express = require("express");
const multer = require("multer");
const {
  submitBazar,
  getUserBazar,
  getAllBazar,
  updateBazarStatus,
  getBazarStats,
} = require("../controllers/bazarController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Member routes
router.post("/submit", verifyToken, upload.single("receiptImage"), submitBazar);
router.get("/user", verifyToken, getUserBazar);

// Admin routes
router.get("/all", verifyToken, isAdmin, getAllBazar);
router.put("/:bazarId/status", verifyToken, isAdmin, updateBazarStatus);
router.get("/stats", verifyToken, isAdmin, getBazarStats);

module.exports = router;
