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

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ email: "test@example.com" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        "admin1230",
        APP_CONFIG.AUTH.PASSWORD_SALT_ROUNDS
      );
      const testUser = new User({
        name: "Test Admin",
        email: "test@example.com",
        password: hashedPassword,
        phone: "+880 1712345678",
        role: "admin",
        status: "active",
      });
      await testUser.save();
      console.log("✅ Test admin user created successfully");
      console.log("Email: test@example.com");
      console.log("Password: admin1230");
      console.log("Role: admin");
    } else {
      console.log("⚠️  Test admin user already exists");
    }

    // Create member user if not exists
    const existingMember = await User.findOne({ email: "mahbub@example.com" });
    if (!existingMember) {
      const hashedPassword = await bcrypt.hash(
        "mahbub1230",
        APP_CONFIG.AUTH.PASSWORD_SALT_ROUNDS
      );
      const memberUser = new User({
        name: "Mahbub",
        email: "mahbub@example.com",
        password: hashedPassword,
        phone: "+880 1812345678",
        role: "member",
        status: "active",
      });
      await memberUser.save();
      console.log("✅ Member user created successfully");
      console.log("Email: mahbub@example.com");
      console.log("Password: mahbub1230");
      console.log("Role: member");
    } else {
      console.log("⚠️  Member user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating test users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createTestUser();
