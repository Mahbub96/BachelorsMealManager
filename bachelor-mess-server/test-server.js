const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running (test mode)",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.status(200).json({
    message: "Test endpoint working",
    data: {
      users: 0,
      meals: 0,
      bazar: 0,
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint at http://localhost:${PORT}/api/test`);
});
