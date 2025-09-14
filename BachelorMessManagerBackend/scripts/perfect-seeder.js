const mongoose = require('mongoose');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
const bcrypt = require('bcryptjs');
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

// Enhanced sample users with more realistic data
const sampleUsers = [
  {
    name: 'Super Administrator',
    email: 'superadmin@mess.com',
    password: 'SuperAdmin@2024',
    role: 'super_admin',
    phone: '+8801234567890',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(),
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
    ],
    paymentHistory: [{
      amount: 5000,
      date: new Date(),
      method: 'bank_transfer',
      status: 'completed',
      notes: 'Monthly contribution'
    }]
  },
  {
    name: 'Admin Manager',
    email: 'admin@mess.com',
    password: 'Admin@2024',
    role: 'admin',
    phone: '+8801234567891',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(),
    paymentHistory: [{
      amount: 5000,
      date: new Date(),
      method: 'bank_transfer',
      status: 'completed',
      notes: 'Monthly contribution'
    }]
  },
  {
    name: 'John Doe',
    email: 'john@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567892',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(),
    paymentHistory: [{
      amount: 5000,
      date: new Date(),
      method: 'cash',
      status: 'completed',
      notes: 'Monthly contribution'
    }]
  },
  {
    name: 'Jane Smith',
    email: 'jane@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567893',
    monthlyContribution: 5000,
    paymentStatus: 'pending',
    totalPaid: 0,
    paymentHistory: []
  },
  {
    name: 'Mike Johnson',
    email: 'mike@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567894',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 10000,
    lastPaymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    paymentHistory: [
      {
        amount: 5000,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        method: 'mobile_banking',
        status: 'completed',
        notes: 'Monthly contribution'
      },
      {
        amount: 5000,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        method: 'bank_transfer',
        status: 'completed',
        notes: 'Previous month contribution'
      }
    ]
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567895',
    monthlyContribution: 5000,
    paymentStatus: 'overdue',
    totalPaid: 2500,
    lastPaymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    paymentHistory: [{
      amount: 2500,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      method: 'cash',
      status: 'completed',
      notes: 'Partial payment'
    }]
  },
  {
    name: 'David Brown',
    email: 'david@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567896',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(),
    paymentHistory: [{
      amount: 5000,
      date: new Date(),
      method: 'bank_transfer',
      status: 'completed',
      notes: 'Monthly contribution'
    }]
  },
  {
    name: 'Lisa Davis',
    email: 'lisa@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567897',
    monthlyContribution: 5000,
    paymentStatus: 'pending',
    totalPaid: 0,
    paymentHistory: []
  }
];

// Enhanced bazar entries with more variety
const sampleBazarEntries = [
  // Groceries
  {
    items: [
      { name: 'Basmati Rice', quantity: 10, unit: 'kg', price: 400 },
      { name: 'Red Lentils', quantity: 3, unit: 'kg', price: 225 },
      { name: 'Yellow Lentils', quantity: 2, unit: 'kg', price: 150 },
      { name: 'Onions', quantity: 2, unit: 'kg', price: 100 },
      { name: 'Garlic', quantity: 0.5, unit: 'kg', price: 50 }
    ],
    totalAmount: 925,
    category: 'groceries',
    status: 'approved',
    notes: 'Weekly grocery shopping for all members',
    approvedBy: null, // Will be set to admin user ID
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    items: [
      { name: 'Chicken (Whole)', quantity: 3, unit: 'kg', price: 450 },
      { name: 'Beef', quantity: 2, unit: 'kg', price: 400 },
      { name: 'Fish (Rui)', quantity: 2, unit: 'kg', price: 300 },
      { name: 'Eggs', quantity: 30, unit: 'pieces', price: 150 }
    ],
    totalAmount: 1300,
    category: 'meat',
    status: 'approved',
    notes: 'Protein for the week',
    approvedBy: null,
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    items: [
      { name: 'Cooking Oil (Soybean)', quantity: 2, unit: 'liter', price: 240 },
      { name: 'Ghee', quantity: 1, unit: 'kg', price: 200 },
      { name: 'Turmeric Powder', quantity: 0.2, unit: 'kg', price: 40 },
      { name: 'Cumin Powder', quantity: 0.1, unit: 'kg', price: 30 },
      { name: 'Coriander Powder', quantity: 0.1, unit: 'kg', price: 25 },
      { name: 'Salt', quantity: 2, unit: 'kg', price: 40 }
    ],
    totalAmount: 575,
    category: 'cooking',
    status: 'approved',
    notes: 'Cooking essentials and spices',
    approvedBy: null,
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    items: [
      { name: 'Potatoes', quantity: 5, unit: 'kg', price: 100 },
      { name: 'Tomatoes', quantity: 3, unit: 'kg', price: 90 },
      { name: 'Green Chili', quantity: 0.5, unit: 'kg', price: 50 },
      { name: 'Coriander Leaves', quantity: 0.2, unit: 'kg', price: 20 },
      { name: 'Mint Leaves', quantity: 0.1, unit: 'kg', price: 15 }
    ],
    totalAmount: 275,
    category: 'vegetables',
    status: 'pending',
    notes: 'Fresh vegetables for cooking',
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date()
  },
  {
    items: [
      { name: 'Milk (Fresh)', quantity: 5, unit: 'liter', price: 250 },
      { name: 'Yogurt', quantity: 2, unit: 'kg', price: 100 },
      { name: 'Cheese', quantity: 0.5, unit: 'kg', price: 150 },
      { name: 'Butter', quantity: 0.5, unit: 'kg', price: 120 }
    ],
    totalAmount: 620,
    category: 'dairy',
    status: 'approved',
    notes: 'Dairy products for the week',
    approvedBy: null,
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  },
  {
    items: [
      { name: 'Bread (White)', quantity: 4, unit: 'loaves', price: 80 },
      { name: 'Biscuits', quantity: 2, unit: 'packets', price: 60 },
      { name: 'Tea', quantity: 0.5, unit: 'kg', price: 200 },
      { name: 'Sugar', quantity: 2, unit: 'kg', price: 80 },
      { name: 'Coffee', quantity: 0.25, unit: 'kg', price: 150 }
    ],
    totalAmount: 570,
    category: 'beverages',
    status: 'rejected',
    notes: 'Breakfast items and beverages',
    approvedBy: null,
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

// Enhanced meal entries for the past week
const generateMealEntries = (users) => {
  const mealEntries = [];
  const memberUsers = users.filter(user => user.role === 'member');
  const adminUser = users.find(user => user.role === 'admin');
  
  // Generate meals for the past 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    
    memberUsers.forEach(user => {
      // Breakfast
      mealEntries.push({
        userId: user._id,
        date: new Date(date),
        mealType: 'breakfast',
        status: i < 3 ? 'approved' : (i < 5 ? 'pending' : 'rejected'),
        notes: 'Regular breakfast',
        approvedBy: i < 3 ? adminUser._id : null,
        approvedAt: i < 3 ? new Date(date) : null,
        createdAt: new Date(date),
        updatedAt: new Date(date)
      });
      
      // Lunch
      mealEntries.push({
        userId: user._id,
        date: new Date(date),
        mealType: 'lunch',
        status: i < 4 ? 'approved' : 'pending',
        notes: 'Regular lunch',
        approvedBy: i < 4 ? adminUser._id : null,
        approvedAt: i < 4 ? new Date(date) : null,
        createdAt: new Date(date),
        updatedAt: new Date(date)
      });
      
      // Dinner
      mealEntries.push({
        userId: user._id,
        date: new Date(date),
        mealType: 'dinner',
        status: i < 2 ? 'approved' : (i < 6 ? 'pending' : 'rejected'),
        notes: 'Regular dinner',
        approvedBy: i < 2 ? adminUser._id : null,
        approvedAt: i < 2 ? new Date(date) : null,
        createdAt: new Date(date),
        updatedAt: new Date(date)
      });
    });
  }
  
  return mealEntries;
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting perfect database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Bazar.deleteMany({});
    await Meal.deleteMany({});
    await Statistics.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users with proper password hashing
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get user IDs for sample data
    const memberUsers = createdUsers.filter(user => user.role === 'member');
    const adminUser = createdUsers.find(user => user.role === 'admin');

    // Create bazar entries
    console.log('🛒 Creating bazar entries...');
    const bazarEntries = sampleBazarEntries.map((entry, index) => ({
      ...entry,
      userId: memberUsers[index % memberUsers.length]._id,
      approvedBy: entry.status === 'approved' ? adminUser._id : null,
      updatedAt: new Date()
    }));
    await Bazar.insertMany(bazarEntries);
    console.log(`✅ Created ${bazarEntries.length} bazar entries`);

    // Create meal entries
    console.log('🍽️  Creating meal entries...');
    const mealEntries = generateMealEntries(createdUsers);
    await Meal.insertMany(mealEntries);
    console.log(`✅ Created ${mealEntries.length} meal entries`);

    // Create comprehensive statistics
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
        rejectedMeals: mealEntries.filter(m => m.status === 'rejected').length
      },
      bazar: {
        totalEntries: bazarEntries.length,
        approvedEntries: bazarEntries.filter(b => b.status === 'approved').length,
        pendingEntries: bazarEntries.filter(b => b.status === 'pending').length,
        rejectedEntries: bazarEntries.filter(b => b.status === 'rejected').length
      },
      lastUpdated: new Date()
    });
    await stats.save();
    console.log('✅ Created statistics');

    console.log('🎉 Perfect database seeding completed successfully!');
    console.log('\n📋 Created Users:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.paymentStatus}`);
    });
    console.log('\n🔑 Login Credentials:');
    console.log('  Super Admin: superadmin@mess.com / SuperAdmin@2024');
    console.log('  Admin: admin@mess.com / Admin@2024');
    console.log('  Members: [email] / Password@123');
    console.log('\n📊 Summary:');
    console.log(`  - ${createdUsers.length} users created`);
    console.log(`  - ${bazarEntries.length} bazar entries created`);
    console.log(`  - ${mealEntries.length} meal entries created`);
    console.log(`  - Statistics initialized`);

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

