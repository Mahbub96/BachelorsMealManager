const mongoose = require('mongoose');
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

// Verify and display data
const verifyData = async () => {
  try {
    console.log('🔍 Verifying seeded data...\n');

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          memberUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'member'] }, 1, 0] },
          },
        },
      },
    ]);

    console.log('👥 User Statistics:');
    console.log(`   Total Users: ${userStats[0]?.totalUsers || 0}`);
    console.log(`   Active Users: ${userStats[0]?.activeUsers || 0}`);
    console.log(`   Admin Users: ${userStats[0]?.adminUsers || 0}`);
    console.log(`   Member Users: ${userStats[0]?.memberUsers || 0}\n`);

    // Get meal statistics
    const mealStats = await Meal.aggregate([
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
          totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
          totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
          approvedMeals: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pendingMeals: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
    ]);

    console.log('🍽️  Meal Statistics:');
    console.log(`   Total Meal Entries: ${mealStats[0]?.totalMeals || 0}`);
    console.log(`   Total Breakfast: ${mealStats[0]?.totalBreakfast || 0}`);
    console.log(`   Total Lunch: ${mealStats[0]?.totalLunch || 0}`);
    console.log(`   Total Dinner: ${mealStats[0]?.totalDinner || 0}`);
    console.log(`   Approved Meals: ${mealStats[0]?.approvedMeals || 0}`);
    console.log(`   Pending Meals: ${mealStats[0]?.pendingMeals || 0}\n`);

    // Get bazar statistics
    const bazarStats = await Bazar.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalItems: { $sum: '$itemCount' },
          approvedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pendingEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
    ]);

    console.log('🛒 Bazar Statistics:');
    console.log(`   Total Entries: ${bazarStats[0]?.totalEntries || 0}`);
    console.log(`   Total Amount: ৳${bazarStats[0]?.totalAmount || 0}`);
    console.log(`   Total Items: ${bazarStats[0]?.totalItems || 0}`);
    console.log(`   Approved Entries: ${bazarStats[0]?.approvedEntries || 0}`);
    console.log(`   Pending Entries: ${bazarStats[0]?.pendingEntries || 0}\n`);

    // Show sample users
    console.log('📋 Sample Users:');
    const sampleUsers = await User.find()
      .limit(5)
      .select('name email role status');
    sampleUsers.forEach(user => {
      console.log(
        `   ${user.name} (${user.email}) - ${user.role} - ${user.status}`
      );
    });

    // Show recent meals
    console.log('\n🍽️  Recent Meals:');
    const recentMeals = await Meal.find()
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(5);

    recentMeals.forEach(meal => {
      const meals = [];
      if (meal.breakfast) meals.push('Breakfast');
      if (meal.lunch) meals.push('Lunch');
      if (meal.dinner) meals.push('Dinner');
      console.log(
        `   ${meal.userId.name} - ${meal.date.toDateString()} - ${meals.join(', ')}`
      );
    });

    // Show recent bazar entries
    console.log('\n🛒 Recent Bazar Entries:');
    const recentBazar = await Bazar.find()
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(5);

    recentBazar.forEach(bazar => {
      console.log(
        `   ${bazar.userId.name} - ${bazar.date.toDateString()} - ৳${bazar.totalAmount} (${bazar.itemCount} items)`
      );
    });

    // Show top spenders
    console.log('\n💰 Top Spenders:');
    const topSpenders = await Bazar.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$totalAmount' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);

    topSpenders.forEach((spender, index) => {
      console.log(
        `   ${index + 1}. ${spender.user.name} - ৳${spender.totalSpent} (${spender.entryCount} entries)`
      );
    });

    // Show meal frequency by user
    console.log('\n🍽️  Meal Frequency by User:');
    const mealFrequency = await Meal.aggregate([
      {
        $group: {
          _id: '$userId',
          totalMeals: { $sum: '$totalMeals' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalMeals: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);

    mealFrequency.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.user.name} - ${user.totalMeals} meals (${user.entryCount} days)`
      );
    });

    console.log('\n✅ Data verification completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: mahbub@mess.com / Password123');
    console.log('   Member: rahim@mess.com / Password123');
    console.log('   Member: karim@mess.com / Password123');
    console.log('   Member: salam@mess.com / Password123');
    console.log('   Member: nazrul@mess.com / Password123');
    console.log('   Member: momin@mess.com / Password123');
    console.log('   Member: jahangir@mess.com / Password123');
    console.log('   Inactive: aziz@mess.com / Password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Data verification failed:', error);
    process.exit(1);
  }
};

// Run verification if this file is executed directly
if (require.main === module) {
  connectDB().then(() => verifyData());
}

module.exports = { verifyData };
