const mongoose = require("mongoose");
const User = require("./models/User");

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/bachelor-mess";

async function deleteTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Find and delete the test user
    const deletedUser = await User.findOneAndDelete({
      email: "test@example.com",
    });

    if (deletedUser) {
      console.log("✅ Test user deleted successfully!");
      console.log("📧 Email:", deletedUser.email);
      console.log("👤 Name:", deletedUser.name);
    } else {
      console.log("ℹ️  Test user not found");
    }
  } catch (error) {
    console.error("❌ Error deleting test user:", error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

deleteTestUser();
