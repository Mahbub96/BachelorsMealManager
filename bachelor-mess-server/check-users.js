// Check existing users
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/bachelor-mess"
    );
    console.log("✅ Connected to MongoDB");

    // Get all users
    const users = await User.find({}).select("name email role createdAt");

    console.log("\n📋 Users in database:");
    console.log("=====================");

    if (users.length === 0) {
      console.log("❌ No users found in database");
    } else {
      users.forEach((user, index) => {
        console.log(
          `${index + 1}. ${user.name} (${user.email}) - ${
            user.role
          } - Created: ${user.createdAt.toLocaleDateString()}`
        );
      });
    }

    // Check for specific users
    console.log("\n🔍 Checking for specific users:");
    console.log("=============================");

    const mahbub = await User.findOne({ email: "mahbub@example.com" });
    if (mahbub) {
      console.log("✅ Mahbub found:", mahbub.name, "- Role:", mahbub.role);
    } else {
      console.log("❌ Mahbub not found");
    }

    const testUser = await User.findOne({ email: "test@example.com" });
    if (testUser) {
      console.log(
        "✅ Test user found:",
        testUser.name,
        "- Role:",
        testUser.role
      );
    } else {
      console.log("❌ Test user not found");
    }

    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      console.log(
        "✅ Admin user found:",
        adminUser.name,
        "(",
        adminUser.email,
        ")"
      );
    } else {
      console.log("❌ No admin user found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

checkUsers();
