const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Meal = require("./models/Meal");
const Bazar = require("./models/Bazar");

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bachelor-mess";

async function createMahbubData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if Mahbub already exists
    const existingMahbub = await User.findOne({ email: "mahbub@example.com" });
    if (existingMahbub) {
      console.log("⚠️  Mahbub already exists, updating data...");
      await User.findByIdAndDelete(existingMahbub._id);
      await Meal.deleteMany({ userId: existingMahbub._id });
      await Bazar.deleteMany({ userId: existingMahbub._id });
    }

    // Create Mahbub user
    const hashedPassword = await bcrypt.hash("mahbub123", 10);
    const mahbub = new User({
      name: "Mahbub Rahman",
      email: "mahbub@example.com",
      phone: "+8801712345678",
      password: hashedPassword,
      role: "member",
      status: "active",
      joinDate: new Date("2024-01-15"),
      address: "Dhaka, Bangladesh",
      emergencyContact: {
        name: "Rahman Family",
        phone: "+8801812345678",
        relationship: "Father",
      },
      preferences: {
        dietaryRestrictions: ["No pork"],
        mealPreferences: ["Rice", "Fish", "Vegetables"],
        allergies: ["None"],
      },
    });

    await mahbub.save();
    console.log("✅ Created Mahbub user");

    // Generate meal data for the last 30 days
    const mealData = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      // Random meal selection (more realistic pattern)
      const breakfast = Math.random() > 0.2; // 80% chance of breakfast
      const lunch = Math.random() > 0.1; // 90% chance of lunch
      const dinner = Math.random() > 0.15; // 85% chance of dinner

      // Skip some days (weekends, occasional days)
      const dayOfWeek = date.getDay();
      const shouldSkip =
        (dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.7;

      if (!shouldSkip && (breakfast || lunch || dinner)) {
        mealData.push({
          userId: mahbub._id,
          date: dateString,
          breakfast,
          lunch,
          dinner,
          status: i < 5 ? "pending" : "approved", // Recent meals pending, older ones approved
          approvedBy: i < 5 ? null : "admin-user-id", // Will be updated with actual admin ID
          approvedAt:
            i < 5 ? null : new Date(date.getTime() + 2 * 60 * 60 * 1000), // 2 hours after submission
          notes: i % 7 === 0 ? "Weekly meal update" : "",
          createdAt: new Date(date.getTime() + 7 * 60 * 60 * 1000), // 7 AM
          updatedAt: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        });
      }
    }

    await Meal.insertMany(mealData);
    console.log(`✅ Created ${mealData.length} meal entries for Mahbub`);

    // Generate bazar data for the last 30 days
    const bazarData = [];
    const bazarItems = [
      { name: "Rice", quantity: "5 kg", price: 600 },
      { name: "Vegetables", quantity: "2 kg", price: 300 },
      { name: "Fish", quantity: "1 kg", price: 400 },
      { name: "Chicken", quantity: "2 kg", price: 500 },
      { name: "Oil", quantity: "1 L", price: 180 },
      { name: "Spices", quantity: "0.5 kg", price: 100 },
      { name: "Eggs", quantity: "30 pieces", price: 150 },
      { name: "Milk", quantity: "2 L", price: 200 },
      { name: "Bread", quantity: "2 packets", price: 80 },
      { name: "Potatoes", quantity: "3 kg", price: 120 },
      { name: "Onions", quantity: "2 kg", price: 100 },
      { name: "Tomatoes", quantity: "1 kg", price: 80 },
      { name: "Cooking Gas", quantity: "1 cylinder", price: 1200 },
      { name: "Sugar", quantity: "1 kg", price: 120 },
      { name: "Tea", quantity: "0.5 kg", price: 200 },
    ];

    // Create bazar entries (about 8 entries in 30 days)
    const bazarDates = [
      new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
      new Date(today.getTime() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
      new Date(today.getTime() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
      new Date(today.getTime() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
    ];

    for (let i = 0; i < bazarDates.length; i++) {
      const date = bazarDates[i];
      const dateString = date.toISOString().split("T")[0];

      // Random selection of items (3-6 items per entry)
      const numItems = Math.floor(Math.random() * 4) + 3;
      const selectedItems = [];
      const usedIndices = new Set();

      for (let j = 0; j < numItems; j++) {
        let index;
        do {
          index = Math.floor(Math.random() * bazarItems.length);
        } while (usedIndices.has(index));

        usedIndices.add(index);
        selectedItems.push(bazarItems[index]);
      }

      const totalAmount = selectedItems.reduce(
        (sum, item) => sum + item.price,
        0
      );

      bazarData.push({
        userId: mahbub._id,
        date: dateString,
        items: selectedItems,
        totalAmount,
        description: `Weekly grocery shopping - ${dateString}`,
        receiptImage: null,
        status: i < 2 ? "pending" : "approved", // Recent entries pending
        approvedBy: i < 2 ? null : "admin-user-id",
        approvedAt:
          i < 2 ? null : new Date(date.getTime() + 3 * 60 * 60 * 1000),
        notes: i % 3 === 0 ? "Good quality items purchased" : "",
        createdAt: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        updatedAt: new Date(date.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      });
    }

    await Bazar.insertMany(bazarData);
    console.log(`✅ Created ${bazarData.length} bazar entries for Mahbub`);

    // Calculate and display statistics
    const totalMeals = mealData.reduce(
      (sum, meal) =>
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0),
      0
    );

    const totalBazarAmount = bazarData.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0
    );

    console.log("\n📊 Mahbub's Statistics:");
    console.log(`🍽️  Total Meals: ${totalMeals}`);
    console.log(`💰 Total Bazar Contribution: ৳${totalBazarAmount}`);
    console.log(`📅 Days Active: ${mealData.length}`);
    console.log(`🛒 Bazar Entries: ${bazarData.length}`);
    console.log(`📈 Average Meals/Day: ${(totalMeals / 30).toFixed(1)}`);
    console.log(`💵 Average Bazar/Day: ৳${(totalBazarAmount / 30).toFixed(0)}`);

    console.log("\n✅ Mahbub data generation completed successfully!");
    console.log("\n🔑 Login Credentials:");
    console.log("Email: mahbub@example.com");
    console.log("Password: mahbub123");
  } catch (error) {
    console.error("❌ Error creating Mahbub data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
createMahbubData();
