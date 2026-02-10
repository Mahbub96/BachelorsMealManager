const mongoose = require('mongoose');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
    // process.exit(1);
  }
};

// Sample users
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
    superAdminPermissions: ['manage_users', 'manage_admins', 'view_all_data', 'system_settings', 'analytics_access', 'backup_restore', 'audit_logs', 'billing_management', 'support_management'],
    paymentHistory: [{ amount: 5000, date: new Date(), method: 'bank_transfer', status: 'completed', notes: 'Monthly contribution' }]
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
    paymentHistory: [{ amount: 5000, date: new Date(), method: 'bank_transfer', status: 'completed', notes: 'Monthly contribution' }]
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
    paymentHistory: [{ amount: 5000, date: new Date(), method: 'cash', status: 'completed', notes: 'Monthly contribution' }]
  },
  {
    name: 'Mahbub Alam',
    email: 'mahbub@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567893',
    monthlyContribution: 5000,
    paymentStatus: 'pending',
    totalPaid: 0,
    paymentHistory: []
  },
  {
    name: 'Rafiqul Islam',
    email: 'rafiqul@mess.com',
    password: 'Password@123',
    role: 'member',
    phone: '+8801234567894',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    paymentHistory: [{ amount: 5000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), method: 'mobile_banking', status: 'completed', notes: 'Monthly contribution' }]
  }
];

// Sample bazar entries
const sampleBazarEntries = [
  {
    items: [
      { name: 'Rice (Basmati)', quantity: 10, unit: 'kg', price: 500 },
      { name: 'Lentils (Masoor Dal)', quantity: 3, unit: 'kg', price: 180 },
      { name: 'Onions', quantity: 5, unit: 'kg', price: 150 }
    ],
    totalAmount: 830,
    category: 'groceries',
    status: 'approved',
    notes: 'Weekly grocery shopping'
  },
  {
    items: [
      { name: 'Beef', quantity: 2, unit: 'kg', price: 400 },
      { name: 'Fish (Rui)', quantity: 2, unit: 'kg', price: 300 }
    ],
    totalAmount: 700,
    category: 'meat',
    status: 'pending',
    notes: 'Protein for the week'
  }
];

// Generate meal entries for past 7 days
const generateMealEntries = (members, admin) => {
  const meals = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    date.setUTCHours(0, 0, 0, 0);
    members.forEach(member => {
      meals.push({
        userId: member._id,
        date,
        breakfast: true,
        lunch: true,
        dinner: i < 5,
        status: i < 3 ? 'approved' : (i < 5 ? 'pending' : 'rejected'),
        notes: `Meals for ${date.toDateString()}`,
        approvedBy: i < 3 ? admin._id : null,
        approvedAt: i < 3 ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }
  return meals;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    await User.deleteMany({});
    await Bazar.deleteMany({});
    await Meal.deleteMany({});
    await Statistics.deleteMany({});
    console.log('🗑️ Cleared previous data');

    // Create users (order: super_admin, admin, then members so we can set createdBy)
    const createdUsers = [];
    for (const u of sampleUsers) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    const admin = createdUsers.find(u => u.role === 'admin');
    const members = createdUsers.filter(u => u.role === 'member');
    // Link members to admin so group (getGroupMemberIds) includes them for dashboard/bazar
    if (admin) {
      await User.updateMany(
        { _id: { $in: members.map(m => m._id) } },
        { $set: { createdBy: admin._id } }
      );
      console.log(`✅ Set createdBy to admin for ${members.length} members`);
    }

    // Create bazar entries
    const bazarData = sampleBazarEntries.map((entry, idx) => ({
      ...entry,
      userId: members[idx % members.length]._id,
      approvedBy: entry.status === 'approved' ? admin._id : null,
      approvedAt: entry.status === 'approved' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await Bazar.insertMany(bazarData);
    console.log(`✅ Created ${bazarData.length} bazar entries`);

    // Create meals
    const meals = generateMealEntries(members, admin);
    await Meal.insertMany(meals);
    console.log(`✅ Created ${meals.length} meal entries`);

    // Create statistics
    const stats = new Statistics({
      users: {
        totalUsers: createdUsers.length,
        adminUsers: createdUsers.filter(u => u.role === 'admin').length,
        memberUsers: members.length,
        inactiveUsers: 0,
        newUsersThisMonth: createdUsers.length,
        activeUsersThisMonth: createdUsers.length
      },
      meals: {
        totalMeals: meals.length,
        approvedMeals: meals.filter(m => m.status === 'approved').length,
        pendingMeals: meals.filter(m => m.status === 'pending').length,
        rejectedMeals: meals.filter(m => m.status === 'rejected').length
      },
      bazar: {
        totalEntries: bazarData.length,
        approvedEntries: bazarData.filter(b => b.status === 'approved').length,
        pendingEntries: bazarData.filter(b => b.status === 'pending').length,
        rejectedEntries: bazarData.filter(b => b.status === 'rejected').length
      },
      lastUpdated: new Date()
    });
    await stats.save();
    console.log('✅ Statistics initialized');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(seedDatabase);
