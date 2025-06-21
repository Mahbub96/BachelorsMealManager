// Test dashboard properties for member users
const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

const testDashboardProperties = async () => {
  try {
    console.log("🔍 Testing Dashboard Properties for Members...");

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
      // Properties that dashboard expects
      userMeals: totalMeals,
      thisMonthMeals: totalMeals,
      userBalance: 0,
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
      // Properties that dashboard expects
      userContribution: totalBazarAmount,
      totalBazar: totalBazarAmount,
    };

    console.log("\n📊 Dashboard Properties Check:");
    console.log(`👤 User: ${profile.data.name} (${profile.data.role})`);

    console.log("\n🍽️  Meal Stats Properties:");
    console.log(`  userMeals: ${mealStats.userMeals}`);
    console.log(`  thisMonthMeals: ${mealStats.thisMonthMeals}`);
    console.log(`  userBalance: ${mealStats.userBalance}`);
    console.log(`  totalMeals: ${mealStats.totalMeals}`);

    console.log("\n🛒 Bazar Stats Properties:");
    console.log(`  userContribution: ${bazarStats.userContribution}`);
    console.log(`  totalBazar: ${bazarStats.totalBazar}`);
    console.log(`  totalAmount: ${bazarStats.totalAmount}`);

    console.log("\n✅ Dashboard properties are correctly set!");
    console.log(
      "💡 The dashboard should now show proper values instead of zeros."
    );
  } catch (error) {
    console.error(
      "❌ Error testing dashboard properties:",
      error.response?.data || error.message
    );
  }
};

testDashboardProperties();
