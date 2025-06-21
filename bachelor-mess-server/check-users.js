// Check existing users
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/bachelor-mess", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkUsers = async () => {
  try {
    console.log("🔍 Checking existing users...");

    const users = await User.find({}).select("name email role status");

    console.log("\n📋 Users in database:");
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.name} (${user.email}) - Role: ${
          user.role
        } - Status: ${user.status}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking users:", error);
  } finally {
    mongoose.connection.close();
  }
};

checkUsers();
