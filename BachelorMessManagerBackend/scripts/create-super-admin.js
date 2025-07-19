const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

// Database connection
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI is not configured');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Create super admin function
const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mahbub.dev' });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Status:', existingAdmin.status);
      return;
    }

    // Create super admin user
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'admin@mahbub.dev',
      password: 'test1230',
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      joinDate: new Date(),
    });

    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: admin@mahbub.dev');
    console.log('🔑 Password: test1230');
    console.log('👑 Role: admin');
    console.log('✅ Status: active');
    console.log('📅 Created at:', superAdmin.createdAt);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  Super admin already exists with this email');
    }
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Creating Super Admin...');
  console.log('📧 Email: admin@mahbub.dev');
  console.log('🔑 Password: test1230');
  console.log('👑 Role: admin');
  console.log('');

  await connectDB();
  await createSuperAdmin();

  console.log('');
  console.log('🎉 Script completed!');

  // Close database connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
