// Create admin user for testing
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

mongoose.connect("mongodb://localhost:27017/bachelor-mess", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAdmin = async () => {
  try {
    console.log("🚀 Creating admin user...");

    // Check if admin already exists
    let admin = await User.findOne({ role: "admin" });
    if (admin) {
      console.log("✅ Admin user already exists:", admin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      phone: "+8801712345679",
      status: "active",
      joinDate: new Date("2024-01-01"),
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@example.com");
    console.log("🔑 Password: admin123");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
