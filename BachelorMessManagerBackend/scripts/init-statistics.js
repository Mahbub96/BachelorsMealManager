const mongoose = require('mongoose');
const Statistics = require('../src/models/Statistics');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize statistics
const initStatistics = async () => {
  try {
    console.log('📊 Initializing statistics...');

    // Clear existing statistics
    await Statistics.deleteMany({});
    console.log('🗑️  Cleared existing statistics');

    // Get current counts
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const memberUsers = await User.countDocuments({ role: 'member' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });

    const totalMeals = await Meal.countDocuments();
    const approvedMeals = await Meal.countDocuments({ status: 'approved' });
    const pendingMeals = await Meal.countDocuments({ status: 'pending' });
    const rejectedMeals = await Meal.countDocuments({ status: 'rejected' });

    const totalBazar = await Bazar.countDocuments();
    const approvedBazar = await Bazar.countDocuments({ status: 'approved' });
    const pendingBazar = await Bazar.countDocuments({ status: 'pending' });
    const rejectedBazar = await Bazar.countDocuments({ status: 'rejected' });

    // Get current month data
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    const activeUsersThisMonth = await User.countDocuments({
      status: 'active',
      lastLogin: { $gte: currentMonth },
    });

    // Create statistics document
    const stats = new Statistics({
      users: {
        totalUsers,
        adminUsers,
        memberUsers,
        inactiveUsers,
        newUsersThisMonth,
        activeUsersThisMonth,
      },
      meals: {
        totalMeals,
        approvedMeals,
        pendingMeals,
        rejectedMeals,
      },
      bazar: {
        totalEntries: totalBazar,
        approvedEntries: approvedBazar,
        pendingEntries: pendingBazar,
        rejectedEntries: rejectedBazar,
      },
      lastUpdated: new Date(),
    });

    await stats.save();
    console.log('✅ Statistics initialized successfully!');

    console.log('\n📈 Current Statistics:');
    console.log(
      `  Users: ${totalUsers} (${adminUsers} admins, ${memberUsers} members, ${inactiveUsers} inactive)`
    );
    console.log(
      `  Meals: ${totalMeals} (${approvedMeals} approved, ${pendingMeals} pending, ${rejectedMeals} rejected)`
    );
    console.log(
      `  Bazar: ${totalBazar} (${approvedBazar} approved, ${pendingBazar} pending, ${rejectedBazar} rejected)`
    );
    console.log(`  New users this month: ${newUsersThisMonth}`);
    console.log(`  Active users this month: ${activeUsersThisMonth}`);
  } catch (error) {
    console.error('❌ Statistics initialization failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run initialization
connectDB().then(() => {
  initStatistics();
});
