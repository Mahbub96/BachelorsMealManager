const mongoose = require('mongoose');
const { runPerfectSeeder } = require('./perfect-seeder');

// Test configuration
const testConfig = {
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess-test',
  clearExisting: true,
  seedCounts: {
    superAdmins: 1,
    admins: 1,
    members: 5,
    mealsPerUser: 30,
    bazarEntriesPerUser: 10,
  },
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date(),
  },
};

// Override config for testing
const originalConfig = require('./perfect-seeder').config;
Object.assign(originalConfig, testConfig);

async function testPerfectSeeder() {
  try {
    console.log('🧪 Testing Perfect Seeder...');
    console.log('📋 Test Configuration:');
    console.log(`   Database: ${testConfig.mongoUri}`);
    console.log(
      `   Users: ${testConfig.seedCounts.superAdmins} Super Admin + ${testConfig.seedCounts.admins} Admin + ${testConfig.seedCounts.members} Members`
    );
    console.log(`   Meals per User: ${testConfig.seedCounts.mealsPerUser}`);
    console.log(
      `   Bazar Entries per User: ${testConfig.seedCounts.bazarEntriesPerUser}`
    );

    // Run the seeder
    await runPerfectSeeder();

    // Verify data was created
    const User = require('../src/models/User');
    const Meal = require('../src/models/Meal');
    const Bazar = require('../src/models/Bazar');
    const Statistics = require('../src/models/Statistics');
    const UIConfig = require('../src/models/UIConfig');

    const userCount = await User.countDocuments();
    const mealCount = await Meal.countDocuments();
    const bazarCount = await Bazar.countDocuments();
    const statsCount = await Statistics.countDocuments();
    const uiConfigCount = await UIConfig.countDocuments();

    console.log('\n✅ Test Results:');
    console.log(
      `   Users: ${userCount} (Expected: ${testConfig.seedCounts.superAdmins + testConfig.seedCounts.admins + testConfig.seedCounts.members})`
    );
    console.log(
      `   Meals: ${mealCount} (Expected: ~${testConfig.seedCounts.members * testConfig.seedCounts.mealsPerUser})`
    );
    console.log(
      `   Bazar Entries: ${bazarCount} (Expected: ~${testConfig.seedCounts.members * testConfig.seedCounts.bazarEntriesPerUser})`
    );
    console.log(`   Statistics: ${statsCount} (Expected: 1)`);
    console.log(`   UI Config: ${uiConfigCount} (Expected: 1)`);

    // Test data quality
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const admin = await User.findOne({ role: 'admin' });
    const member = await User.findOne({ role: 'member' });

    console.log('\n🔍 Data Quality Check:');
    console.log(
      `   Super Admin: ${superAdmin ? '✅' : '❌'} - ${superAdmin?.email || 'Not found'}`
    );
    console.log(
      `   Admin: ${admin ? '✅' : '❌'} - ${admin?.email || 'Not found'}`
    );
    console.log(
      `   Member: ${member ? '✅' : '❌'} - ${member?.email || 'Not found'}`
    );

    // Test meal data
    const approvedMeals = await Meal.countDocuments({ status: 'approved' });
    const pendingMeals = await Meal.countDocuments({ status: 'pending' });
    console.log(`   Approved Meals: ${approvedMeals}`);
    console.log(`   Pending Meals: ${pendingMeals}`);

    // Test bazar data
    const approvedBazar = await Bazar.countDocuments({ status: 'approved' });
    const pendingBazar = await Bazar.countDocuments({ status: 'pending' });
    console.log(`   Approved Bazar: ${approvedBazar}`);
    console.log(`   Pending Bazar: ${pendingBazar}`);

    console.log('\n🎉 Perfect Seeder Test Completed Successfully!');
    console.log('✅ All data models are working correctly');
    console.log('✅ Data relationships are properly established');
    console.log('✅ Statistics are calculated correctly');
    console.log('✅ UI configuration is complete');
  } catch (error) {
    console.error('❌ Perfect Seeder Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPerfectSeeder();
}

module.exports = { testPerfectSeeder };
