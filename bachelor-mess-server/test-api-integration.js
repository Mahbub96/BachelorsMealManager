// Comprehensive API Integration Test
const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";
let authToken = "";
let testUserId = "";
let testMealId = "";
let testBazarId = "";

// Test data
const testUser = {
  name: "API Test User",
  email: "apitest@example.com",
  password: "testpass123",
  role: "member",
};

const testMeal = {
  date: new Date().toISOString().split("T")[0],
  breakfast: true,
  lunch: false,
  dinner: true,
  notes: "API test meal",
};

const testBazar = {
  date: new Date().toISOString().split("T")[0],
  items: [
    { name: "Test Item 1", quantity: "1 kg", price: 100 },
    { name: "Test Item 2", quantity: "2 pcs", price: 50 },
  ],
  totalAmount: 200,
  description: "API test bazar entry",
  notes: "Test notes",
};

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

    return await axios(config);
  } catch (error) {
    console.error(
      `❌ ${method.toUpperCase()} ${endpoint} failed:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log("\n🏥 Testing Health Check...");
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check passed:", response.data);
    return true;
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return false;
  }
};

const testAuthEndpoints = async () => {
  console.log("\n🔐 Testing Auth Endpoints...");

  // Test registration
  try {
    const registerResponse = await axios.post(
      `${BASE_URL}/auth/register`,
      testUser
    );
    console.log("✅ Registration passed:", registerResponse.data.message);
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message === "User already exists"
    ) {
      console.log("ℹ️  User already exists, continuing...");
    } else {
      console.log(
        "❌ Registration failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Test login
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    authToken = loginResponse.data.token;
    console.log("✅ Login passed, token received");
    return true;
  } catch (error) {
    console.log("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
};

const testUserEndpoints = async () => {
  console.log("\n👥 Testing User Endpoints...");

  // Test get profile
  try {
    const profileResponse = await makeAuthRequest("GET", "/users/profile");
    console.log("✅ Get profile passed:", profileResponse.data.name);
  } catch (error) {
    console.log("❌ Get profile failed");
    return false;
  }

  // Test get all users (admin only)
  try {
    const allUsersResponse = await makeAuthRequest("GET", "/users/all");
    console.log(
      "✅ Get all users passed:",
      allUsersResponse.data.length,
      "users found"
    );
  } catch (error) {
    if (error.response?.status === 403) {
      console.log("ℹ️  Get all users requires admin role (expected)");
    } else {
      console.log(
        "❌ Get all users failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  return true;
};

const testMealEndpoints = async () => {
  console.log("\n🍽️  Testing Meal Endpoints...");

  // Test submit meal
  try {
    const submitResponse = await makeAuthRequest(
      "POST",
      "/meals/submit",
      testMeal
    );
    testMealId = submitResponse.data.meal._id;
    console.log("✅ Submit meal passed:", submitResponse.data.message);
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("already exists")
    ) {
      console.log("ℹ️  Meal already exists for today, continuing...");
    } else {
      console.log(
        "❌ Submit meal failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Test get user meals
  try {
    const userMealsResponse = await makeAuthRequest("GET", "/meals/user");
    console.log(
      "✅ Get user meals passed:",
      userMealsResponse.data.length,
      "meals found"
    );
  } catch (error) {
    console.log(
      "❌ Get user meals failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testBazarEndpoints = async () => {
  console.log("\n🛒 Testing Bazar Endpoints...");

  // Test submit bazar
  try {
    const submitResponse = await makeAuthRequest(
      "POST",
      "/bazar/submit",
      testBazar
    );
    testBazarId = submitResponse.data.bazar._id;
    console.log("✅ Submit bazar passed:", submitResponse.data.message);
  } catch (error) {
    console.log(
      "❌ Submit bazar failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Test get user bazar
  try {
    const userBazarResponse = await makeAuthRequest("GET", "/bazar/user");
    console.log(
      "✅ Get user bazar passed:",
      userBazarResponse.data.length,
      "entries found"
    );
  } catch (error) {
    console.log(
      "❌ Get user bazar failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testAdminEndpoints = async () => {
  console.log("\n👑 Testing Admin Endpoints...");

  // Create admin user for testing
  const adminUser = {
    name: "API Test Admin",
    email: "apitestadmin@example.com",
    password: "adminpass123",
    role: "admin",
  };

  try {
    await axios.post(`${BASE_URL}/auth/register`, adminUser);
    console.log("✅ Admin user created");
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message === "User already exists"
    ) {
      console.log("ℹ️  Admin user already exists");
    } else {
      console.log(
        "❌ Admin user creation failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Login as admin
  try {
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminUser.email,
      password: adminUser.password,
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Admin login passed");

    // Test admin-only endpoints
    const adminConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    };

    // Test get all meals
    const allMealsResponse = await axios.get(
      `${BASE_URL}/meals/all`,
      adminConfig
    );
    console.log(
      "✅ Get all meals (admin) passed:",
      allMealsResponse.data.length,
      "meals found"
    );

    // Test get all bazar
    const allBazarResponse = await axios.get(
      `${BASE_URL}/bazar/all`,
      adminConfig
    );
    console.log(
      "✅ Get all bazar (admin) passed:",
      allBazarResponse.data.length,
      "entries found"
    );

    // Test meal stats
    const mealStatsResponse = await axios.get(
      `${BASE_URL}/meals/stats`,
      adminConfig
    );
    console.log("✅ Get meal stats (admin) passed:", mealStatsResponse.data);

    // Test bazar stats
    const bazarStatsResponse = await axios.get(
      `${BASE_URL}/bazar/stats`,
      adminConfig
    );
    console.log("✅ Get bazar stats (admin) passed:", bazarStatsResponse.data);
  } catch (error) {
    console.log(
      "❌ Admin endpoints test failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testLogout = async () => {
  console.log("\n🚪 Testing Logout...");

  try {
    const logoutResponse = await makeAuthRequest("POST", "/auth/logout");
    console.log("✅ Logout passed:", logoutResponse.data.message);
    return true;
  } catch (error) {
    console.log("❌ Logout failed:", error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log("🚀 Starting Comprehensive API Integration Test...");
  console.log("📍 Testing against:", BASE_URL);

  const tests = [
    { name: "Health Check", fn: testHealthCheck },
    { name: "Auth Endpoints", fn: testAuthEndpoints },
    { name: "User Endpoints", fn: testUserEndpoints },
    { name: "Meal Endpoints", fn: testMealEndpoints },
    { name: "Bazar Endpoints", fn: testBazarEndpoints },
    { name: "Admin Endpoints", fn: testAdminEndpoints },
    { name: "Logout", fn: testLogout },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
    }
  }

  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All API endpoints are perfectly integrated!");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the server logs.");
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testAuthEndpoints,
  testUserEndpoints,
  testMealEndpoints,
  testBazarEndpoints,
  testAdminEndpoints,
  testLogout,
};
