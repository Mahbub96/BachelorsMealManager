const express = require("express");
const app = express();

// Basic middleware
app.use(express.json());

// Simple test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Minimal test server running on port ${PORT}`);
  console.log(`🧪 Test at http://localhost:${PORT}/test`);
  console.log(`🏥 Health at http://localhost:${PORT}/health`);
});
