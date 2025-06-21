const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Meal = require("./models/Meal");
const Bazar = require("./models/Bazar");

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/bachelor-mess";

// Dummy Users Data
const dummyUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin1230",
    phone: "+8801712345678",
    role: "admin",
    status: "active",
    joinDate: new Date("2024-01-01"),
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "123456",
    phone: "+8801712345679",
    role: "member",
    status: "active",
    joinDate: new Date("2024-01-15"),
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "123456",
    phone: "+8801712345680",
    role: "member",
    status: "active",
    joinDate: new Date("2024-02-01"),
  },
  {
    name: "Mike Johnson",
    email: "mike@example.com",
    password: "123456",
    phone: "+8801712345681",
    role: "member",
    status: "active",
    joinDate: new Date("2024-02-15"),
  },
  {
    name: "Sarah Wilson",
    email: "sarah@example.com",
    password: "123456",
    phone: "+8801712345682",
    role: "member",
    status: "active",
    joinDate: new Date("2024-03-01"),
  },
];

// Generate dummy meals for the last 30 days
function generateDummyMeals(users) {
  const meals = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate meals for each user
    users.forEach((user) => {
      if (user.role === "member") {
        const hasBreakfast = Math.random() > 0.3;
        const hasLunch = Math.random() > 0.2;
        const hasDinner = Math.random() > 0.25;

        if (hasBreakfast || hasLunch || hasDinner) {
          meals.push({
            userId: user._id,
            date: date,
            breakfast: hasBreakfast,
            lunch: hasLunch,
            dinner: hasDinner,
            status: Math.random() > 0.3 ? "approved" : "pending",
            approvedBy: users.find((u) => u.role === "admin")._id,
            approvedAt: Math.random() > 0.3 ? date : null,
            notes: Math.random() > 0.7 ? "Special meal request" : "",
          });
        }
      }
    });
  }

  return meals;
}

// Generate dummy bazar entries
function generateDummyBazar(users) {
  const bazarEntries = [];
  const today = new Date();

  const commonItems = [
    { name: "Rice", price: 120 },
    { name: "Vegetables", price: 150 },
    { name: "Fish", price: 300 },
    { name: "Chicken", price: 250 },
    { name: "Oil", price: 180 },
    { name: "Spices", price: 100 },
    { name: "Onions", price: 80 },
    { name: "Potatoes", price: 60 },
    { name: "Tomatoes", price: 90 },
    { name: "Eggs", price: 120 },
  ];

  for (let i = 0; i < 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const user = users.find((u) => u.role === "member");
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const item = commonItems[Math.floor(Math.random() * commonItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemTotal = item.price * quantity;

      items.push({
        name: item.name,
        quantity: `${quantity} kg`,
        price: item.price,
      });

      totalAmount += itemTotal;
    }

    bazarEntries.push({
      userId: user._id,
      date: date,
      items: items,
      totalAmount: totalAmount,
      description: `Shopping for ${date.toLocaleDateString()}`,
      receiptImage: null,
      status: Math.random() > 0.4 ? "approved" : "pending",
      approvedBy: users.find((u) => u.role === "admin")._id,
      approvedAt: Math.random() > 0.4 ? date : null,
      notes: Math.random() > 0.8 ? "Good quality items" : "",
    });
  }

  return bazarEntries;
}

async function seedDummyData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Meal.deleteMany({});
    await Bazar.deleteMany({});

    // Create users
    console.log("👥 Creating users...");
    const createdUsers = [];

    for (const userData of dummyUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Generate and create meals
    console.log("🍽️  Creating meals...");
    const meals = generateDummyMeals(createdUsers);
    await Meal.insertMany(meals);
    console.log(`✅ Created ${meals.length} meal entries`);

    // Generate and create bazar entries
    console.log("🛒 Creating bazar entries...");
    const bazarEntries = generateDummyBazar(createdUsers);
    await Bazar.insertMany(bazarEntries);
    console.log(`✅ Created ${bazarEntries.length} bazar entries`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`🍽️  Meals: ${meals.length}`);
    console.log(`🛒 Bazar Entries: ${bazarEntries.length}`);

    console.log("\n🔐 Login Credentials:");
    createdUsers.forEach((user) => {
      const userData = dummyUsers.find((u) => u.email === user.email);
      console.log(
        `${user.role.toUpperCase()}: ${user.email} / ${userData.password}`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

seedDummyData();
