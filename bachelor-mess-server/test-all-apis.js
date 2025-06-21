const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

// Test user credentials - using existing admin user
const testUser = {
  email: "admin@example.com",
  password: "admin1230",
};

let authToken = "";

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `❌ ${method} ${endpoint} failed:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Test all APIs
async function testAllAPIs() {
  console.log("🚀 Starting comprehensive API tests...\n");

  // 1. Test Health Check
  console.log("1️⃣ Testing Health Check...");
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check passed:", healthResponse.data);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
  }

  // 2. Test Login
  console.log("\n2️⃣ Testing Login...");
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log("✅ Login successful:", {
      user: loginResponse.data.user.name,
      role: loginResponse.data.user.role,
      token: authToken.substring(0, 20) + "...",
    });
  } catch (error) {
    console.log("❌ Login failed:", error.response?.data || error.message);
    return;
  }

  // 3. Test User Profile
  console.log("\n3️⃣ Testing User Profile...");
  const profile = await makeAuthRequest("GET", "/users/profile");
  if (profile) {
    console.log("✅ Profile retrieved:", profile.name);
  }

  // 4. Test Meal Submission
  console.log("\n4️⃣ Testing Meal Submission...");
  const mealData = {
    breakfast: true,
    lunch: false,
    dinner: true,
    date: new Date().toISOString().split("T")[0], // Today's date
    notes: "Test meal submission",
  };

  const mealSubmission = await makeAuthRequest(
    "POST",
    "/meals/submit",
    mealData
  );
  if (mealSubmission) {
    console.log("✅ Meal submitted successfully:", mealSubmission.message);
  }

  // 5. Test Get User Meals
  console.log("\n5️⃣ Testing Get User Meals...");
  const userMeals = await makeAuthRequest("GET", "/meals/user?limit=5");
  if (userMeals) {
    console.log("✅ User meals retrieved:", userMeals.length, "meals");
  }

  // 6. Test Bazar Submission
  console.log("\n6️⃣ Testing Bazar Submission...");
  const bazarData = {
    items: [
      { name: "Rice", quantity: "2kg", price: 120 },
      { name: "Vegetables", quantity: "1kg", price: 80 },
    ],
    totalAmount: 200,
    date: new Date().toISOString().split("T")[0],
    notes: "Test bazar submission",
  };

  const bazarSubmission = await makeAuthRequest(
    "POST",
    "/bazar/submit",
    bazarData
  );
  if (bazarSubmission) {
    console.log("✅ Bazar submitted successfully:", bazarSubmission.message);
  }

  // 7. Test Get User Bazar
  console.log("\n7️⃣ Testing Get User Bazar...");
  const userBazar = await makeAuthRequest("GET", "/bazar/user?limit=5");
  if (userBazar) {
    console.log("✅ User bazar retrieved:", userBazar.length, "entries");
  }

  // 8. Test Admin APIs (if user is admin)
  console.log("\n8️⃣ Testing Admin APIs...");

  // Get all users
  const allUsers = await makeAuthRequest("GET", "/users/all");
  if (allUsers) {
    console.log("✅ All users retrieved:", allUsers.length, "users");
  }

  // Get meal stats
  const mealStats = await makeAuthRequest("GET", "/meals/stats");
  if (mealStats) {
    console.log("✅ Meal stats retrieved:", mealStats);
  }

  // Get bazar stats
  const bazarStats = await makeAuthRequest("GET", "/bazar/stats");
  if (bazarStats) {
    console.log("✅ Bazar stats retrieved:", bazarStats);
  }

  // 9. Test Logout
  console.log("\n9️⃣ Testing Logout...");
  const logout = await makeAuthRequest("POST", "/auth/logout");
  if (logout) {
    console.log("✅ Logout successful");
  }

  console.log("\n🎉 API testing completed!");
}

// Run the tests
testAllAPIs().catch(console.error);
