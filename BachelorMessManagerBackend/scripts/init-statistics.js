const mongoose = require('mongoose');
const Statistics = require('../src/models/Statistics');
const User = require('../src/models/User');
const Meal = require('../src/models/Meal');
const Bazar = require('../src/models/Bazar');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess'
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize statistics
const initializeStatistics = async () => {
  try {
    console.log('🔄 Initializing statistics...');

    // Update all statistics
    await Statistics.updateAllStatistics();
    console.log('✅ Global statistics updated');

    // Update monthly statistics
    await Statistics.updateMonthlyStatistics();
    console.log('✅ Monthly statistics updated');

    // Get the statistics document
    const stats = await Statistics.getOrCreate();
    const formattedStats = stats.getFormattedStats();

    console.log('\n📊 Statistics Summary:');
    console.log('=====================');
    console.log(`Total Users: ${formattedStats.global.totalUsers}`);
    console.log(`Active Users: ${formattedStats.global.activeUsers}`);
    console.log(`Total Meals: ${formattedStats.global.totalMeals}`);
    console.log(
      `Total Bazar Entries: ${formattedStats.global.totalBazarEntries}`
    );
    console.log(
      `Total Expenses: ৳${formattedStats.global.totalExpenses.toLocaleString()}`
    );
    console.log(
      `Meal Efficiency: ${formattedStats.meals.efficiency.toFixed(1)}%`
    );
    console.log(
      `Average Meals Per Day: ${formattedStats.meals.averageMealsPerDay.toFixed(1)}`
    );
    console.log(
      `Average Bazar Amount: ৳${formattedStats.bazar.averageAmount.toFixed(0)}`
    );

    console.log('\n📅 Current Month:');
    console.log('================');
    console.log(`Meals: ${formattedStats.monthly.currentMonth.meals.total}`);
    console.log(
      `Bazar Amount: ৳${formattedStats.monthly.currentMonth.bazar.totalAmount.toLocaleString()}`
    );
    console.log(
      `New Users: ${formattedStats.monthly.currentMonth.users.newUsers}`
    );

    console.log('\n✅ Statistics initialization completed successfully!');
    console.log(`Last Updated: ${formattedStats.lastUpdated}`);
    console.log(`Cache Version: ${stats.cache.version}`);
  } catch (error) {
    console.error('❌ Error initializing statistics:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await initializeStatistics();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { initializeStatistics };
