const axios = require("axios");

// Test user credentials
const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "admin1230",
  role: "admin",
};

async function createTestUser() {
  try {
    console.log("Creating test user...");

    const response = await axios.post(
      "http://localhost:5001/api/auth/register",
      testUser
    );

    console.log("✅ Test user created successfully!");
    console.log("📧 Email:", testUser.email);
    console.log("🔑 Password:", testUser.password);
    console.log("👤 Role:", testUser.role);
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message === "User already exists"
    ) {
      console.log("ℹ️  Test user already exists!");
      console.log("📧 Email:", testUser.email);
      console.log("🔑 Password:", testUser.password);
      console.log("👤 Role:", testUser.role);
      console.log(
        "💡 To update password, delete the user first or create a new one."
      );
    } else {
      console.error(
        "❌ Error creating test user:",
        error.response?.data || error.message
      );
    }
  }
}

createTestUser();
