const axios = require("axios");

const BASE_URL = "http://192.168.0.130:5001/api";

async function debugMealAPI() {
  console.log("🔍 Debugging Meal API...\n");

  try {
    // 1. Test server health
    console.log("1️⃣ Testing server health...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server health:", healthResponse.data);
    console.log("");

    // 2. Login to get token
    console.log("2️⃣ Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "testuser@example.com",
      password: "testpass123",
    });
    const token = loginResponse.data.token;
    console.log("✅ Login successful, token received");
    console.log("");

    // 2.5. Check existing meals
    console.log("2️⃣5️⃣ Checking existing meals...");
    const existingMealsResponse = await axios.get(`${BASE_URL}/meals/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("📅 Existing meals:");
    existingMealsResponse.data.forEach((meal, index) => {
      console.log(
        `   ${index + 1}. Date: ${meal.date}, Breakfast: ${
          meal.breakfast
        }, Lunch: ${meal.lunch}, Dinner: ${meal.dinner}, Status: ${meal.status}`
      );
    });
    console.log("");

    // 3. Test meal submission with detailed logging
    console.log("3️⃣ Testing meal submission...");
    const today = new Date();
    const mealData = {
      date: today.toISOString().split("T")[0],
      breakfast: true,
      lunch: false,
      dinner: true,
      notes: "Debug test meal for today",
    };

    console.log("📤 Sending meal data:", JSON.stringify(mealData, null, 2));
    console.log("🔑 Using token:", token.substring(0, 20) + "...");
    console.log("📅 Today's date:", today.toISOString().split("T")[0]);

    const mealResponse = await axios.post(
      `${BASE_URL}/meals/submit`,
      mealData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Meal submitted successfully:", mealResponse.data);
    console.log("");

    // 4. Test getting user meals
    console.log("4️⃣ Testing get user meals...");
    const userMealsResponse = await axios.get(`${BASE_URL}/meals/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(
      "✅ User meals retrieved:",
      userMealsResponse.data.length,
      "meals"
    );
    console.log("");
  } catch (error) {
    console.error("❌ Error occurred:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);
    console.error("Headers:", error.config?.headers);
    console.error("Data sent:", error.config?.data);
    console.error("Response data:", error.response?.data);
    console.error("Full error:", error.message);
  }
}

debugMealAPI();
