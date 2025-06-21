// Test Client Integration - Verify all APIs work perfectly
const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";
let mahbubToken = "";
let adminToken = "";

// Test data
const testMeal = {
  date: new Date().toISOString().split("T")[0],
  breakfast: true,
  lunch: false,
  dinner: true,
  notes: "Client integration test meal",
};

const testBazar = {
  date: new Date().toISOString().split("T")[0],
  items: [{ name: "Test Item", quantity: "1 kg", price: 100 }],
  totalAmount: 100,
  description: "Client integration test",
  notes: "Test bazar entry",
};

// Helper function to make authenticated requests
const makeAuthRequest = async (
  method,
  endpoint,
  data = null,
  token = mahbubToken
) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
const testAuthFlow = async () => {
  console.log("\n🔐 Testing Auth Flow...");

  // Login as Mahbub
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "mahbub@example.com",
      password: "mahbub123",
    });
    mahbubToken = loginResponse.data.token;
    console.log("✅ Mahbub login successful");
  } catch (error) {
    console.log(
      "❌ Mahbub login failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Login as Admin
  try {
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "admin1230",
    });
    adminToken = adminLoginResponse.data.token;
    console.log("✅ Admin login successful");
  } catch (error) {
    console.log(
      "❌ Admin login failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testUserEndpoints = async () => {
  console.log("\n👤 Testing User Endpoints...");

  // Get Mahbub's profile
  try {
    const profileResponse = await makeAuthRequest("GET", "/users/profile");
    console.log("✅ Get profile successful:", profileResponse.data.name);
  } catch (error) {
    console.log("❌ Get profile failed");
    return false;
  }

  // Get all users (admin only)
  try {
    const allUsersResponse = await makeAuthRequest(
      "GET",
      "/users/all",
      null,
      adminToken
    );
    console.log(
      "✅ Get all users successful:",
      allUsersResponse.data.length,
      "users"
    );
  } catch (error) {
    console.log(
      "❌ Get all users failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testMealEndpoints = async () => {
  console.log("\n🍽️  Testing Meal Endpoints...");

  // Submit meal
  try {
    const submitResponse = await makeAuthRequest(
      "POST",
      "/meals/submit",
      testMeal
    );
    console.log("✅ Submit meal successful:", submitResponse.data.message);
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("already exists")
    ) {
      console.log("ℹ️  Meal already exists for today (expected)");
    } else {
      console.log(
        "❌ Submit meal failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Get user meals
  try {
    const userMealsResponse = await makeAuthRequest("GET", "/meals/user");
    console.log(
      "✅ Get user meals successful:",
      userMealsResponse.data.length,
      "meals"
    );
  } catch (error) {
    console.log(
      "❌ Get user meals failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Get all meals (admin)
  try {
    const allMealsResponse = await makeAuthRequest(
      "GET",
      "/meals/all",
      null,
      adminToken
    );
    console.log(
      "✅ Get all meals successful:",
      allMealsResponse.data.length,
      "meals"
    );
  } catch (error) {
    console.log(
      "❌ Get all meals failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Get meal stats (admin)
  try {
    const statsResponse = await makeAuthRequest(
      "GET",
      "/meals/stats",
      null,
      adminToken
    );
    console.log("✅ Get meal stats successful:", statsResponse.data);
  } catch (error) {
    console.log(
      "❌ Get meal stats failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testBazarEndpoints = async () => {
  console.log("\n🛒 Testing Bazar Endpoints...");

  // Submit bazar
  try {
    const submitResponse = await makeAuthRequest(
      "POST",
      "/bazar/submit",
      testBazar
    );
    console.log("✅ Submit bazar successful:", submitResponse.data.message);
  } catch (error) {
    console.log(
      "❌ Submit bazar failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Get user bazar
  try {
    const userBazarResponse = await makeAuthRequest("GET", "/bazar/user");
    console.log(
      "✅ Get user bazar successful:",
      userBazarResponse.data.length,
      "entries"
    );
  } catch (error) {
    console.log(
      "❌ Get user bazar failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Get all bazar (admin)
  try {
    const allBazarResponse = await makeAuthRequest(
      "GET",
      "/bazar/all",
      null,
      adminToken
    );
    console.log(
      "✅ Get all bazar successful:",
      allBazarResponse.data.length,
      "entries"
    );
  } catch (error) {
    console.log(
      "❌ Get all bazar failed:",
      error.response?.data || error.message
    );
    return false;
  }

  // Get bazar stats (admin)
  try {
    const statsResponse = await makeAuthRequest(
      "GET",
      "/bazar/stats",
      null,
      adminToken
    );
    console.log("✅ Get bazar stats successful:", statsResponse.data);
  } catch (error) {
    console.log(
      "❌ Get bazar stats failed:",
      error.response?.data || error.message
    );
    return false;
  }

  return true;
};

const testDashboardData = async () => {
  console.log("\n📊 Testing Dashboard Data...");

  // Test Mahbub's dashboard data
  try {
    const [profile, meals, bazar] = await Promise.all([
      makeAuthRequest("GET", "/users/profile"),
      makeAuthRequest("GET", "/meals/user"),
      makeAuthRequest("GET", "/bazar/user"),
    ]);

    const totalMeals = meals.data.reduce((sum, meal) => {
      return (
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0)
      );
    }, 0);

    const totalBazarAmount = bazar.data.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0
    );

    console.log("✅ Dashboard data calculation successful:");
    console.log(`   👤 User: ${profile.data.name}`);
    console.log(`   🍽️  Total Meals: ${totalMeals}`);
    console.log(`   🛒 Total Bazar Amount: ${totalBazarAmount} Tk`);
    console.log(`   📅 Recent Meals: ${meals.data.length} entries`);
    console.log(`   📅 Recent Bazar: ${bazar.data.length} entries`);
  } catch (error) {
    console.log(
      "❌ Dashboard data test failed:",
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
    console.log("✅ Logout successful:", logoutResponse.data.message);
    return true;
  } catch (error) {
    console.log("❌ Logout failed:", error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runClientIntegrationTests = async () => {
  console.log("🚀 Starting Client Integration Tests...");
  console.log("📍 Testing against:", BASE_URL);

  const tests = [
    { name: "Auth Flow", fn: testAuthFlow },
    { name: "User Endpoints", fn: testUserEndpoints },
    { name: "Meal Endpoints", fn: testMealEndpoints },
    { name: "Bazar Endpoints", fn: testBazarEndpoints },
    { name: "Dashboard Data", fn: testDashboardData },
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

  console.log("\n📊 Client Integration Test Results:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All APIs are perfectly integrated with the client!");
    console.log("💡 The client should now display Mahbub's data correctly.");
    console.log("\n📱 Next Steps:");
    console.log("1. Restart your Expo client");
    console.log("2. Login as Mahbub (mahbub@example.com / mahbub123)");
    console.log("3. Check the dashboard and meals/bazar screens");
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the server and client configuration."
    );
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runClientIntegrationTests().catch(console.error);
}

module.exports = {
  runClientIntegrationTests,
  testAuthFlow,
  testUserEndpoints,
  testMealEndpoints,
  testBazarEndpoints,
  testDashboardData,
  testLogout,
};
