const mongoose = require('mongoose');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess-dev';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Sample users (status: 'active' so protect middleware allows login)
const sampleUsers = [
  {
    name: 'Super Administrator',
    email: 'superadmin@mess.com',
    password: 'SuperAdmin@2024',
    role: 'super_admin',
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
    phone: '+8801234567894',
    monthlyContribution: 5000,
    paymentStatus: 'paid',
    totalPaid: 5000,
    lastPaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    paymentHistory: [{ amount: 5000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), method: 'mobile_banking', status: 'completed', notes: 'Monthly contribution' }]
  }
];

// Sample bazar entries (match Bazar model: items have name, quantity string, price; no category/unit)
const sampleBazarEntries = [
  {
    items: [
      { name: 'Rice (Basmati)', quantity: '10 kg', price: 500 },
      { name: 'Lentils (Masoor Dal)', quantity: '3 kg', price: 180 },
      { name: 'Onions', quantity: '5 kg', price: 150 }
    ],
    totalAmount: 830,
    description: 'Weekly grocery shopping',
    status: 'approved',
    notes: 'Weekly grocery shopping'
  },
  {
    items: [
      { name: 'Beef', quantity: '2 kg', price: 400 },
      { name: 'Fish (Rui)', quantity: '2 kg', price: 300 }
    ],
    totalAmount: 700,
    description: 'Protein for the week',
    status: 'pending',
    notes: 'Protein for the week'
  },
  {
    items: [
      { name: 'Potato', quantity: '5 kg', price: 100 },
      { name: 'Oil', quantity: '1 L', price: 250 }
    ],
    totalAmount: 350,
    description: 'Cooking essentials',
    status: 'approved',
    notes: 'Cooking essentials'
  }
];

// Generate meal entries for past 7 days (includes optional guest meal counts)
const generateMealEntries = (members, admin) => {
  const meals = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    date.setUTCHours(0, 0, 0, 0);
    members.forEach((member, memberIdx) => {
      // Add guest meals for some entries (e.g. 1–2 days per member with 1–2 guests)
      const hasGuests = i <= 2 && memberIdx < 2; // first 2 days, first 2 members
      const guestBreakfast = hasGuests && i === 0 ? 1 : 0;
      const guestLunch = hasGuests && i === 1 ? 2 : hasGuests && i === 0 ? 1 : 0;
      const guestDinner = hasGuests && i === 2 ? 1 : 0;
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
        guestBreakfast,
        guestLunch,
        guestDinner,
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

    // Create bazar entries (Bazar model requires date; totalAmount must equal sum of item prices)
    const now = new Date();
    const bazarData = sampleBazarEntries.map((entry, idx) => ({
      ...entry,
      type: entry.type || 'meal',
      userId: members[idx % members.length]._id,
      date: new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
      approvedBy: entry.status === 'approved' ? admin._id : null,
      approvedAt: entry.status === 'approved' ? new Date() : null
    }));
    await Bazar.insertMany(bazarData);
    console.log(`✅ Created ${bazarData.length} bazar entries`);

    // Create meals
    const meals = generateMealEntries(members, admin);
    await Meal.insertMany(meals);
    console.log(`✅ Created ${meals.length} meal entries`);

    // Create statistics (align with Statistics schema: global, meals, bazar, users, monthly)
    const approvedBazar = bazarData.filter(b => b.status === 'approved').length;
    const pendingBazar = bazarData.filter(b => b.status === 'pending').length;
    const rejectedBazar = bazarData.filter(b => b.status === 'rejected').length;
    const totalBazarAmount = bazarData.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const stats = new Statistics({
      global: {
        totalUsers: createdUsers.length,
        activeUsers: createdUsers.filter(u => u.status === 'active').length,
        totalMeals: meals.length,
        totalBazarEntries: bazarData.length,
        totalExpenses: totalBazarAmount,
        lastUpdated: new Date()
      },
      users: {
        adminUsers: createdUsers.filter(u => u.role === 'admin').length,
        memberUsers: members.length,
        inactiveUsers: 0,
        newUsersThisMonth: createdUsers.length,
        activeUsersThisMonth: createdUsers.length,
        lastUpdated: new Date()
      },
      meals: {
        totalBreakfast: meals.filter(m => m.breakfast).length,
        totalLunch: meals.filter(m => m.lunch).length,
        totalDinner: meals.filter(m => m.dinner).length,
        pendingMeals: meals.filter(m => m.status === 'pending').length,
        approvedMeals: meals.filter(m => m.status === 'approved').length,
        rejectedMeals: meals.filter(m => m.status === 'rejected').length,
        lastUpdated: new Date()
      },
      bazar: {
        totalAmount: totalBazarAmount,
        totalEntries: bazarData.length,
        pendingEntries: pendingBazar,
        approvedEntries: approvedBazar,
        rejectedEntries: rejectedBazar,
        averageAmount: bazarData.length > 0 ? totalBazarAmount / bazarData.length : 0,
        lastUpdated: new Date()
      }
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
