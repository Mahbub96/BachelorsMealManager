const mongoose = require("mongoose");
const User = require("./models/User");
const Meal = require("./models/Meal");
const APP_CONFIG = require("./config/app");

async function deleteTodaysMeal() {
  await mongoose.connect(
    APP_CONFIG.DATABASE.MONGO_URI,
    APP_CONFIG.DATABASE.OPTIONS
  );
  const user = await User.findOne({ email: "testuser@example.com" });
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const result = await Meal.deleteOne({
    userId: user._id,
    date: {
      $gte: new Date(todayString),
      $lt: new Date(new Date(todayString).getTime() + 24 * 60 * 60 * 1000),
    },
  });
  if (result.deletedCount > 0) {
    console.log("✅ Deleted today's meal entry for", user.email);
  } else {
    console.log("No meal entry found for today for", user.email);
  }
  await mongoose.disconnect();
}

deleteTodaysMeal();
