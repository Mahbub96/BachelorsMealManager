const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    // Create super admin user
    const superAdminData = {
      name: 'Super Administrator',
      email: 'superadmin@messmanager.com',
      password: 'SuperAdmin@2024',
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true,
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
    };

    const superAdmin = await User.create(superAdminData);

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', 'SuperAdmin@2024');
    console.log('👤 Role:', superAdmin.role);
    console.log('🆔 ID:', superAdmin._id);

    console.log('\n🔐 Login Credentials:');
    console.log('Email: superadmin@messmanager.com');
    console.log('Password: SuperAdmin@2024');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    throw error;
  }
}

createSuperAdmin();
