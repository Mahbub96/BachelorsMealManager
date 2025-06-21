// Test dashboard data for member users
const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

const testMemberDashboard = async () => {
  try {
    console.log("🔍 Testing Member Dashboard Data...");

    // Login as Mahbub (member)
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "mahbub@example.com",
      password: "mahbub123",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful as Mahbub");

    // Test the endpoints that the dashboard will call
    const [profile, userMeals, userBazar] = await Promise.all([
      axios.get(`${BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${BASE_URL}/meals/user?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${BASE_URL}/bazar/user?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    console.log("✅ All API calls successful");

    // Calculate stats like the dashboard does
    const totalMeals = userMeals.data.reduce((sum, meal) => {
      return (
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0)
      );
    }, 0);

    const totalBazarAmount = userBazar.data.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0
    );

    const mealStats = {
      totalMeals,
      totalBreakfast: userMeals.data.reduce(
        (sum, meal) => sum + (meal.breakfast ? 1 : 0),
        0
      ),
      totalLunch: userMeals.data.reduce(
        (sum, meal) => sum + (meal.lunch ? 1 : 0),
        0
      ),
      totalDinner: userMeals.data.reduce(
        (sum, meal) => sum + (meal.dinner ? 1 : 0),
        0
      ),
      pendingCount: userMeals.data.filter((meal) => meal.status === "pending")
        .length,
      approvedCount: userMeals.data.filter((meal) => meal.status === "approved")
        .length,
      rejectedCount: userMeals.data.filter((meal) => meal.status === "rejected")
        .length,
    };

    const bazarStats = {
      totalAmount: totalBazarAmount,
      totalEntries: userBazar.data.length,
      pendingCount: userBazar.data.filter((entry) => entry.status === "pending")
        .length,
      approvedCount: userBazar.data.filter(
        (entry) => entry.status === "approved"
      ).length,
      rejectedCount: userBazar.data.filter(
        (entry) => entry.status === "rejected"
      ).length,
      averageAmount:
        userBazar.data.length > 0
          ? totalBazarAmount / userBazar.data.length
          : 0,
    };

    console.log("\n📊 Member Dashboard Data:");
    console.log(`👤 User: ${profile.data.name} (${profile.data.role})`);
    console.log(`🍽️  Meal Stats:`, mealStats);
    console.log(`🛒 Bazar Stats:`, bazarStats);
    console.log(`📅 Recent Meals: ${userMeals.data.length} entries`);
    console.log(`📅 Recent Bazar: ${userBazar.data.length} entries`);

    console.log("\n✅ Member dashboard data calculation successful!");
    console.log("💡 The client dashboard should now work for Mahbub.");
  } catch (error) {
    console.error(
      "❌ Error testing member dashboard:",
      error.response?.data || error.message
    );
  }
};

testMemberDashboard();
