// Server Setup using centralized configuration
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const APP_CONFIG = require("./config/app");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const mealRoutes = require("./routes/mealRoutes");
const bazarRoutes = require("./routes/bazarRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, APP_CONFIG.UPLOAD.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: APP_CONFIG.SERVER.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from uploads directory
app.use(
  `/${APP_CONFIG.UPLOAD.UPLOAD_DIR}`,
  express.static(path.join(__dirname, APP_CONFIG.UPLOAD.UPLOAD_DIR))
);

// Routes
app.use(`${APP_CONFIG.API.PREFIX}/auth`, authRoutes);
app.use(`${APP_CONFIG.API.PREFIX}/meals`, mealRoutes);
app.use(`${APP_CONFIG.API.PREFIX}/bazar`, bazarRoutes);
app.use(`${APP_CONFIG.API.PREFIX}/users`, userRoutes);

// Health check endpoint
app.get(`${APP_CONFIG.API.PREFIX}/health`, (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    version: APP_CONFIG.API.VERSION,
    environment: APP_CONFIG.SERVER.NODE_ENV,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: "File upload error",
      error: err.message,
    });
  }

  res.status(500).json({
    message: "Internal Server Error",
    error:
      APP_CONFIG.SERVER.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database Connection
mongoose
  .connect(APP_CONFIG.DATABASE.MONGO_URI, APP_CONFIG.DATABASE.OPTIONS)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start Server
const PORT = APP_CONFIG.SERVER.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📱 API available at http://localhost:${PORT}${APP_CONFIG.API.PREFIX}`
  );
  console.log(
    `🏥 Health check at http://localhost:${PORT}${APP_CONFIG.API.PREFIX}/health`
  );
  console.log(`🌍 Environment: ${APP_CONFIG.SERVER.NODE_ENV}`);
});
