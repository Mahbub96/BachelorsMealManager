r; // Add comprehensive data for Mahbub
const mongoose = require("mongoose");
const User = require("./models/User");
const Meal = require("./models/Meal");
const Bazar = require("./models/Bazar");

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/bachelor-mess", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addMahbubData = async () => {
  try {
    console.log("🚀 Starting to add comprehensive data for Mahbub...");

    // Find Mahbub user
    const mahbub = await User.findOne({ email: "mahbub@example.com" });
    if (!mahbub) {
      console.log("❌ Mahbub user not found. Please create the user first.");
      return;
    }

    console.log("✅ Found Mahbub user:", mahbub.name);

    // Create admin user for approval
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = new User({
        name: "Admin User",
        email: "admin@example.com",
        password:
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
        role: "admin",
        phone: "+8801712345679",
        status: "active",
        joinDate: new Date("2024-01-01"),
      });
      await admin.save();
      console.log("✅ Created admin user for approvals");
    }

    // Clear existing data for Mahbub
    await Meal.deleteMany({ userId: mahbub._id });
    await Bazar.deleteMany({ userId: mahbub._id });
    console.log("🧹 Cleared existing data for Mahbub");

    // Generate meals for the last 30 days
    const meals = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip weekends occasionally
      if (i % 7 === 0 && Math.random() > 0.7) continue;

      const breakfast = Math.random() > 0.2; // 80% chance
      const lunch = Math.random() > 0.1; // 90% chance
      const dinner = Math.random() > 0.15; // 85% chance

      // Don't create meal if no meals selected
      if (!breakfast && !lunch && !dinner) continue;

      const status = Math.random() > 0.3 ? "approved" : "pending";
      const approvedBy = status === "approved" ? admin._id : null;
      const approvedAt =
        status === "approved"
          ? new Date(date.getTime() + 2 * 60 * 60 * 1000)
          : null;

      const meal = new Meal({
        userId: mahbub._id,
        date: date.toISOString().split("T")[0],
        breakfast,
        lunch,
        dinner,
        status,
        approvedBy,
        approvedAt,
        notes: getMealNotes(breakfast, lunch, dinner),
        createdAt: new Date(date.getTime() - 6 * 60 * 60 * 1000), // 6 AM
        updatedAt: approvedAt || new Date(date.getTime() - 6 * 60 * 60 * 1000),
      });

      meals.push(meal);
    }

    // Generate bazar entries for the last 30 days
    const bazarEntries = [];
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
      { name: "Onions", quantity: "1 kg", price: 60 },
      { name: "Tomatoes", quantity: "1 kg", price: 80 },
      { name: "Cooking Oil", quantity: "1 L", price: 160 },
      { name: "Sugar", quantity: "1 kg", price: 90 },
      { name: "Tea", quantity: "0.25 kg", price: 120 },
    ];

    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 2); // Every 2 days

      const numItems = Math.floor(Math.random() * 4) + 2; // 2-5 items
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const item = bazarItems[Math.floor(Math.random() * bazarItems.length)];
        items.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        });
        totalAmount += item.price;
      }

      const status = Math.random() > 0.4 ? "approved" : "pending";
      const approvedBy = status === "approved" ? admin._id : null;
      const approvedAt =
        status === "approved"
          ? new Date(date.getTime() + 4 * 60 * 60 * 1000)
          : null;

      const bazar = new Bazar({
        userId: mahbub._id,
        date: date.toISOString().split("T")[0],
        items,
        totalAmount,
        description: getBazarDescription(items),
        receiptImage: null,
        status,
        approvedBy,
        approvedAt,
        notes: getBazarNotes(items),
        createdAt: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM
        updatedAt: approvedAt || new Date(date.getTime() + 8 * 60 * 60 * 1000),
      });

      bazarEntries.push(bazar);
    }

    // Save all data
    await Meal.insertMany(meals);
    await Bazar.insertMany(bazarEntries);

    console.log(`✅ Added ${meals.length} meals for Mahbub`);
    console.log(`✅ Added ${bazarEntries.length} bazar entries for Mahbub`);

    // Calculate and display stats
    const totalMeals = meals.reduce((sum, meal) => {
      return (
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0)
      );
    }, 0);

    const totalBazarAmount = bazarEntries.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0
    );

    console.log("\n📊 Mahbub's Data Summary:");
    console.log(`🍽️  Total Meals: ${totalMeals}`);
    console.log(`🛒 Total Bazar Amount: ${totalBazarAmount} Tk`);
    console.log(`📅 Data Range: Last 30 days`);
    console.log(
      `✅ Approved Meals: ${
        meals.filter((m) => m.status === "approved").length
      }`
    );
    console.log(
      `⏳ Pending Meals: ${meals.filter((m) => m.status === "pending").length}`
    );
    console.log(
      `✅ Approved Bazar: ${
        bazarEntries.filter((b) => b.status === "approved").length
      }`
    );
    console.log(
      `⏳ Pending Bazar: ${
        bazarEntries.filter((b) => b.status === "pending").length
      }`
    );

    console.log("\n🎉 Mahbub's data has been successfully added!");
    console.log("💡 The dashboard should now show proper statistics.");
  } catch (error) {
    console.error("❌ Error adding Mahbub data:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Helper functions
function getMealNotes(breakfast, lunch, dinner) {
  const meals = [];
  if (breakfast) meals.push("breakfast");
  if (lunch) meals.push("lunch");
  if (dinner) meals.push("dinner");

  const notes = [
    `${meals.join(", ")} - regular day`,
    `${meals.join(", ")} - good appetite`,
    `${meals.join(", ")} - busy day`,
    `${meals.join(", ")} - healthy choices`,
    `${meals.join(", ")} - home cooked`,
    `${meals.join(", ")} - mess food`,
    `${meals.join(", ")} - light meals`,
    `${meals.join(", ")} - full day`,
  ];

  return notes[Math.floor(Math.random() * notes.length)];
}

function getBazarDescription(items) {
  const descriptions = [
    "Weekly grocery shopping",
    "Cooking essentials",
    "Breakfast items",
    "Lunch preparation",
    "Dinner ingredients",
    "Monthly supplies",
    "Fresh produce",
    "Kitchen staples",
    "Meal preparation",
    "Household items",
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getBazarNotes(items) {
  const notes = [
    "Good quality items",
    "Fresh products",
    "Best prices",
    "Local market",
    "Supermarket purchase",
    "Fresh vegetables",
    "Quality meat",
    "Organic products",
    "Bulk purchase",
    "Daily essentials",
  ];

  return notes[Math.floor(Math.random() * notes.length)];
}

// Run the script
addMahbubData();
