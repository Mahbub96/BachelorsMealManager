const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test seeder - creates minimal test data
const testUsers = [
  {
    name: 'Test Admin',
    email: 'test@mess.com',
    password: 'test123',
    role: 'admin',
    phone: '+8801234567890',
    monthlyContribution: 5000,
    paymentStatus: 'paid'
  },
  {
    name: 'Test Member',
    email: 'member@mess.com',
    password: 'test123',
    role: 'member',
    phone: '+8801234567891',
    monthlyContribution: 5000,
    paymentStatus: 'paid'
  }
];

const testSeed = async () => {
  try {
    console.log('🧪 Starting test seeding...');

    // Clear test users
    await User.deleteMany({ email: { $in: ['test@mess.com', 'member@mess.com'] } });
    console.log('🗑️  Cleared existing test data');

    // Create test users
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);

    console.log('🎉 Test seeding completed!');
    console.log('\n🔑 Test Credentials:');
    console.log('  Admin: test@mess.com / test123');
    console.log('  Member: member@mess.com / test123');

  } catch (error) {
    console.error('❌ Test seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test seeding
connectDB().then(() => {
  testSeed();
});

