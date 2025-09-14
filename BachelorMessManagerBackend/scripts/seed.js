const mongoose = require('mongoose');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
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

// Sample users data
const sampleUsers = [
  {
    name: 'Super Admin',
    email: 'superadmin@mess.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '+8801234567890',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
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
      'support_management'
    ]
  },
  {
    name: 'Admin User',
    email: 'admin@mess.com',
    password: 'admin123',
    role: 'admin',
    phone: '+8801234567891',
    monthlyContribution: 5000,
    paymentStatus: 'paid'
  },
  {
    name: 'John Doe',
    email: 'john@mess.com',
    password: 'password123',
    role: 'member',
    phone: '+8801234567892',
    monthlyContribution: 5000,
    paymentStatus: 'paid'
  },
  {
    name: 'Jane Smith',
    email: 'jane@mess.com',
    password: 'password123',
    role: 'member',
    phone: '+8801234567893',
    monthlyContribution: 5000,
    paymentStatus: 'pending'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@mess.com',
    password: 'password123',
    role: 'member',
    phone: '+8801234567894',
    monthlyContribution: 5000,
    paymentStatus: 'paid'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@mess.com',
    password: 'password123',
    role: 'member',
    phone: '+8801234567895',
    monthlyContribution: 5000,
    paymentStatus: 'overdue'
  }
];

// Sample bazar entries
const sampleBazarEntries = [
  {
    userId: null, // Will be set to actual user ID
    items: [
      { name: 'Rice', quantity: 5, unit: 'kg', price: 200 },
      { name: 'Lentils', quantity: 2, unit: 'kg', price: 150 },
      { name: 'Onions', quantity: 1, unit: 'kg', price: 50 }
    ],
    totalAmount: 400,
    category: 'groceries',
    status: 'approved',
    notes: 'Weekly grocery shopping'
  },
  {
    userId: null,
    items: [
      { name: 'Chicken', quantity: 2, unit: 'kg', price: 300 },
      { name: 'Fish', quantity: 1, unit: 'kg', price: 250 },
      { name: 'Vegetables', quantity: 3, unit: 'kg', price: 100 }
    ],
    totalAmount: 650,
    category: 'meat',
    status: 'approved',
    notes: 'Protein for the week'
  },
  {
    userId: null,
    items: [
      { name: 'Cooking Oil', quantity: 1, unit: 'liter', price: 120 },
      { name: 'Spices', quantity: 0.5, unit: 'kg', price: 80 },
      { name: 'Salt', quantity: 1, unit: 'kg', price: 20 }
    ],
    totalAmount: 220,
    category: 'cooking',
    status: 'pending',
    notes: 'Cooking essentials'
  }
];

// Sample meal entries
const sampleMealEntries = [
  {
    userId: null, // Will be set to actual user ID
    date: new Date(),
    mealType: 'breakfast',
    status: 'approved',
    notes: 'Regular breakfast'
  },
  {
    userId: null,
    date: new Date(),
    mealType: 'lunch',
    status: 'approved',
    notes: 'Regular lunch'
  },
  {
    userId: null,
    date: new Date(),
    mealType: 'dinner',
    status: 'pending',
    notes: 'Regular dinner'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Bazar.deleteMany({});
    await Meal.deleteMany({});
    await Statistics.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get user IDs for sample data
    const memberUsers = createdUsers.filter(user => user.role === 'member');
    const adminUser = createdUsers.find(user => user.role === 'admin');

    // Create bazar entries
    console.log('🛒 Creating bazar entries...');
    const bazarEntries = sampleBazarEntries.map((entry, index) => ({
      ...entry,
      userId: memberUsers[index % memberUsers.length]._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await Bazar.insertMany(bazarEntries);
    console.log(`✅ Created ${bazarEntries.length} bazar entries`);

    // Create meal entries
    console.log('🍽️  Creating meal entries...');
    const mealEntries = sampleMealEntries.map((entry, index) => ({
      ...entry,
      userId: memberUsers[index % memberUsers.length]._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await Meal.insertMany(mealEntries);
    console.log(`✅ Created ${mealEntries.length} meal entries`);

    // Create initial statistics
    console.log('📊 Creating statistics...');
    const stats = new Statistics({
      users: {
        totalUsers: createdUsers.length,
        adminUsers: createdUsers.filter(u => u.role === 'admin').length,
        memberUsers: createdUsers.filter(u => u.role === 'member').length,
        inactiveUsers: 0,
        newUsersThisMonth: createdUsers.length,
        activeUsersThisMonth: createdUsers.length
      },
      meals: {
        totalMeals: mealEntries.length,
        approvedMeals: mealEntries.filter(m => m.status === 'approved').length,
        pendingMeals: mealEntries.filter(m => m.status === 'pending').length,
        rejectedMeals: 0
      },
      bazar: {
        totalEntries: bazarEntries.length,
        approvedEntries: bazarEntries.filter(b => b.status === 'approved').length,
        pendingEntries: bazarEntries.filter(b => b.status === 'pending').length,
        rejectedEntries: 0
      },
      lastUpdated: new Date()
    });
    await stats.save();
    console.log('✅ Created statistics');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Created Users:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('\n🔑 Default Login Credentials:');
    console.log('  Super Admin: superadmin@mess.com / admin123');
    console.log('  Admin: admin@mess.com / admin123');
    console.log('  Members: [email] / password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
connectDB().then(() => {
  seedDatabase();
});

