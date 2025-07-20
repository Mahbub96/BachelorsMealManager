const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess';
    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');

    // Find super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' });

    if (superAdmin) {
      console.log('✅ Super Admin found:');
      console.log('📧 Email:', superAdmin.email);
      console.log('👤 Name:', superAdmin.name);
      console.log('🔑 Role:', superAdmin.role);
      console.log('🆔 ID:', superAdmin._id);
      console.log('📅 Created:', superAdmin.createdAt);
      console.log('✅ Status:', superAdmin.status);

      console.log('\n🔐 Login Credentials:');
      console.log('Email: superadmin@bachelormess.com');
      console.log('Password: SuperAdmin@2024');
    } else {
      console.log('❌ No super admin found');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking super admin:', error.message);
    throw error;
  }
}

checkSuperAdmin();
