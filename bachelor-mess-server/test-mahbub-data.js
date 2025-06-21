// Test Mahbub's data accessibility
const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

const testMahbubData = async () => {
  try {
    console.log("🔍 Testing Mahbub's data accessibility...");

    // Login as Mahbub
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "mahbub@example.com",
      password: "mahbub123",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful");

    // Test profile
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("👤 Profile:", profileResponse.data.name);

    // Test meals
    const mealsResponse = await axios.get(`${BASE_URL}/meals/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🍽️  Meals count:", mealsResponse.data.length);

    // Test bazar
    const bazarResponse = await axios.get(`${BASE_URL}/bazar/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🛒 Bazar count:", bazarResponse.data.length);

    // Calculate totals
    const totalMeals = mealsResponse.data.reduce((sum, meal) => {
      return (
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0)
      );
    }, 0);

    const totalBazarAmount = bazarResponse.data.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0
    );

    console.log("\n📊 Mahbub's Data Summary:");
    console.log(`🍽️  Total Meal Instances: ${totalMeals}`);
    console.log(`🛒 Total Bazar Amount: ${totalBazarAmount} Tk`);
    console.log(`📅 Meal Entries: ${mealsResponse.data.length}`);
    console.log(`📅 Bazar Entries: ${bazarResponse.data.length}`);

    console.log("\n✅ Mahbub's data is accessible via API!");
    console.log("💡 The client should now show this data.");
  } catch (error) {
    console.error(
      "❌ Error testing Mahbub data:",
      error.response?.data || error.message
    );
  }
};

testMahbubData();
