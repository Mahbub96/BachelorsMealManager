// Placeholder for User Model
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: String,
    },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
