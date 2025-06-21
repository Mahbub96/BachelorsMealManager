// Auth Middleware
const jwt = require("jsonwebtoken");
const APP_CONFIG = require("../config/app");

// Middleware to verify JWT and extract user info
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const verified = jwt.verify(token, APP_CONFIG.AUTH.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Middleware to check for admin role
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied: Admins only" });
  }
  next();
};
