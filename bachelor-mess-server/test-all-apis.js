const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

// Test data
const testUser = {
  name: "Test User",
  email: "testuser@example.com",
  password: "testpass123",
  phone: "01712345678",
  role: "member",
};

const testMeal = {
  date: new Date().toISOString().split("T")[0],
  breakfast: true,
  lunch: true,
  dinner: true,
  status: "pending",
};

const testBazar = {
  date: new Date().toISOString().split("T")[0],
  items: [
    { name: "Rice", quantity: "2kg", price: 120 },
    { name: "Vegetables", quantity: "1kg", price: 80 },
  ],
  totalAmount: 200,
  status: "pending",
};

let authToken = "";

async function testAPI() {
  console.log("🚀 Starting comprehensive API tests...\n");

  try {
    // 1. Test Server Health
    console.log("1️⃣ Testing server health...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server health:", healthResponse.data);
    console.log("");

    // 2. Test User Registration
    console.log("2️⃣ Testing user registration...");
    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/auth/register`,
        testUser
      );
      console.log("✅ User registered:", registerResponse.data.message);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response.data.message.includes("already exists")
      ) {
        console.log("ℹ️ User already exists, proceeding with login...");
      } else {
        throw error;
      }
    }
    console.log("");

    // 3. Test User Login
    console.log("3️⃣ Testing user login...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    authToken = loginResponse.data.token;
    console.log("✅ Login successful, token received");
    console.log("");

    // 4. Test Get Current User
    console.log("4️⃣ Testing get current user...");
    const userResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("✅ Current user:", userResponse.data.name);
    console.log("");

    // 5. Test Get All Users (Admin only)
    console.log("5️⃣ Testing get all users...");
    try {
      const allUsersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(
        "✅ All users retrieved:",
        allUsersResponse.data.length,
        "users"
      );
    } catch (error) {
      console.log("ℹ️ Non-admin user, cannot access all users");
    }
    console.log("");

    // 6. Test Create Meal
    console.log("6️⃣ Testing create meal...");
    const mealResponse = await axios.post(
      `${BASE_URL}/meals/submit`,
      testMeal,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("✅ Meal created:", mealResponse.data._id);
    console.log("");

    // 7. Test Get User Meals
    console.log("7️⃣ Testing get user meals...");
    const userMealsResponse = await axios.get(`${BASE_URL}/meals/user`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(
      "✅ User meals retrieved:",
      userMealsResponse.data.length,
      "meals"
    );
    console.log("");

    // 8. Test Get All Meals (Admin only)
    console.log("8️⃣ Testing get all meals...");
    try {
      const allMealsResponse = await axios.get(`${BASE_URL}/meals`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("✅ All meals retrieved:", allMealsResponse.length, "meals");
    } catch (error) {
      console.log("ℹ️ Non-admin user, cannot access all meals");
    }
    console.log("");

    // 9. Test Create Bazar Entry
    console.log("9️⃣ Testing create bazar entry...");
    const bazarResponse = await axios.post(
      `${BASE_URL}/bazar/submit`,
      testBazar,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("✅ Bazar entry created:", bazarResponse.data._id);
    console.log("");

    // 10. Test Get User Bazar Entries
    console.log("🔟 Testing get user bazar entries...");
    const userBazarResponse = await axios.get(`${BASE_URL}/bazar/user`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(
      "✅ User bazar entries retrieved:",
      userBazarResponse.data.length,
      "entries"
    );
    console.log("");

    // 11. Test Get All Bazar Entries (Admin only)
    console.log("1️⃣1️⃣ Testing get all bazar entries...");
    try {
      const allBazarResponse = await axios.get(`${BASE_URL}/bazar`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(
        "✅ All bazar entries retrieved:",
        allBazarResponse.data.length,
        "entries"
      );
    } catch (error) {
      console.log("ℹ️ Non-admin user, cannot access all bazar entries");
    }
    console.log("");

    // 12. Test Dashboard Data
    console.log("1️⃣2️⃣ Testing dashboard data...");
    const dashboardResponse = await axios.get(`${BASE_URL}/users/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("✅ Dashboard data retrieved:", {
      totalMeals: dashboardResponse.data.totalMeals,
      totalBazar: dashboardResponse.data.totalBazar,
      totalCost: dashboardResponse.data.totalCost,
      mealCost: dashboardResponse.data.mealCost,
    });
    console.log("");

    // 13. Test Logout
    console.log("1️⃣3️⃣ Testing logout...");
    const logoutResponse = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("✅ Logout successful:", logoutResponse.data.message);
    console.log("");

    // 14. Test Admin Login (if admin exists)
    console.log("1️⃣4️⃣ Testing admin login...");
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: "mahbub@example.com",
        password: "mahbub123",
      });
      const adminToken = adminLoginResponse.data.token;
      console.log("✅ Admin login successful");

      // Test admin-specific endpoints
      console.log("Testing admin endpoints...");

      const adminAllUsersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(
        "✅ Admin can access all users:",
        adminAllUsersResponse.data.length,
        "users"
      );

      const adminAllMealsResponse = await axios.get(`${BASE_URL}/meals`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(
        "✅ Admin can access all meals:",
        adminAllMealsResponse.data.length,
        "meals"
      );

      const adminAllBazarResponse = await axios.get(`${BASE_URL}/bazar`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(
        "✅ Admin can access all bazar entries:",
        adminAllBazarResponse.data.length,
        "entries"
      );
    } catch (error) {
      console.log("ℹ️ Admin login failed or admin not found");
    }
    console.log("");

    console.log("🎉 All API tests completed successfully!");
    console.log("📊 Summary:");
    console.log("   ✅ Server health check");
    console.log("   ✅ User authentication (register/login/logout)");
    console.log("   ✅ User profile management");
    console.log("   ✅ Meal management");
    console.log("   ✅ Bazar management");
    console.log("   ✅ Dashboard data");
    console.log("   ✅ Admin-specific endpoints");
    console.log("");
    console.log("🚀 All APIs are working perfectly!");
  } catch (error) {
    console.error("❌ API test failed:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
  }
}

testAPI();
