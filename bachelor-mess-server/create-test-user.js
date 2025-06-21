const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const APP_CONFIG = require("./config/app");

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
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

const User = mongoose.model("User", userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      APP_CONFIG.DATABASE.MONGO_URI,
      APP_CONFIG.DATABASE.OPTIONS
    );
    console.log("✅ Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("⚠️  Test user already exists");
      console.log("Email: test@example.com");
      console.log("Password: admin1230");
      console.log("Role: admin");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      "admin1230",
      APP_CONFIG.AUTH.PASSWORD_SALT_ROUNDS
    );

    // Create test user
    const testUser = new User({
      name: "Test Admin",
      email: "test@example.com",
      password: hashedPassword,
      phone: "+880 1712345678",
      role: "admin",
      status: "active",
    });

    await testUser.save();
    console.log("✅ Test user created successfully");
    console.log("Email: test@example.com");
    console.log("Password: admin1230");
    console.log("Role: admin");
  } catch (error) {
    console.error("❌ Error creating test user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createTestUser();
