const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create super admin user
const createSuperAdmin = async () => {
  try {
    console.log('🔧 Creating Super Admin user...');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️ Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    // Super admin data
    const superAdminData = {
      name: 'Super Administrator',
      email: 'superadmin@bachelormess.com',
      password: 'SuperAdmin@2024',
      phone: '+8801234567890',
      role: 'super_admin',
      status: 'active',
      isSuperAdmin: true,
      superAdminPermissions: [
        'manage_users',
        'manage_admins',
        'view_all_data',
        'system_settings',
        'analytics_access',
        'backup_restore',
        'audit_logs',
        'billing_management',
        'support_management',
      ],
      isEmailVerified: true,
      joinDate: new Date(),
      lastLogin: new Date(),
    };

    // Create super admin user
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('👤 Role:', superAdminData.role);
    console.log(
      '🔐 Permissions:',
      superAdminData.superAdminPermissions.length,
      'permissions granted'
    );

    console.log('\n🎯 Super Admin Capabilities:');
    console.log('• Full system access and control');
    console.log('• User management (create, update, delete)');
    console.log('• Admin role management');
    console.log('• System settings configuration');
    console.log('• Analytics and reporting access');
    console.log('• Backup and restore operations');
    console.log('• Audit log monitoring');
    console.log('• Billing and support management');

    console.log(
      '\n⚠️ IMPORTANT: Change the default password after first login!'
    );
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await createSuperAdmin();
    console.log('\n🎉 Super Admin setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createSuperAdmin };
