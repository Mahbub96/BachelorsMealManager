require('dotenv').config();

const mongoose = require('mongoose');
const { config, validateConfig } = require('../src/config/config');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
const AdminChangeRequest = require('../src/models/AdminChangeRequest');
const Election = require('../src/models/Election');
const RemovalRequest = require('../src/models/RemovalRequest');
const PaymentRequest = require('../src/models/PaymentRequest');
const Refund = require('../src/models/Refund');
const LedgerEntry = require('../src/models/LedgerEntry');

const connectDB = async () => {
  try {
    // Validate configuration and use central database config
    validateConfig();
    const uri =
      config.database.uri ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/bachelor-mess-dev';

    const conn = await mongoose.connect(uri, config.database.options || {});
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
    type: 'meal',
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
    type: 'meal',
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
    type: 'meal',
    items: [
      { name: 'Potato', quantity: '5 kg', price: 100 },
      { name: 'Oil', quantity: '1 L', price: 250 }
    ],
    totalAmount: 350,
    description: 'Cooking essentials',
    status: 'approved',
    notes: 'Cooking essentials'
  },
  {
    type: 'flat',
    items: [
      { name: 'Gas bill', quantity: '1 month', price: 1200 },
      { name: 'WiFi bill', quantity: '1 month', price: 800 }
    ],
    totalAmount: 2000,
    description: 'Shared utilities (flat bazar)',
    status: 'approved',
    notes: 'Shared flat expenses for the month'
  }
];

// Month boundary helpers (UTC)
function getMonthStart(monthOffset) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() + monthOffset);
  return d;
}
function getMonthEnd(monthOffset) {
  const d = getMonthStart(monthOffset + 1);
  d.setUTCMilliseconds(-1);
  return d;
}

// Bazar entries for a given month (last month = -1, current = 0)
const bazarTemplatesLastMonth = [
  { type: 'meal', items: [{ name: 'Rice', quantity: '12 kg', price: 600 }, { name: 'Dal', quantity: '2 kg', price: 140 }], totalAmount: 740, description: 'Staples', status: 'approved' },
  { type: 'meal', items: [{ name: 'Vegetables', quantity: '5 kg', price: 250 }, { name: 'Eggs', quantity: '30 pcs', price: 300 }], totalAmount: 550, description: 'Produce', status: 'approved' },
  { type: 'meal', items: [{ name: 'Chicken', quantity: '3 kg', price: 600 }, { name: 'Spices', quantity: '1 set', price: 150 }], totalAmount: 750, description: 'Protein', status: 'approved' },
  { type: 'flat', items: [{ name: 'Electricity', quantity: '1 month', price: 900 }, { name: 'Gas', quantity: '1 cylinder', price: 1100 }], totalAmount: 2000, description: 'Utilities', status: 'approved' },
  { type: 'meal', items: [{ name: 'Oil', quantity: '2 L', price: 500 }, { name: 'Salt/Sugar', quantity: '1 kg each', price: 120 }], totalAmount: 620, description: 'Kitchen', status: 'approved' },
  { type: 'meal', items: [{ name: 'Fish', quantity: '2 kg', price: 400 }], totalAmount: 400, description: 'Fish week', status: 'pending' },
];

const bazarTemplatesCurrentMonth = [
  { type: 'meal', items: [{ name: 'Rice (Basmati)', quantity: '10 kg', price: 500 }, { name: 'Lentils', quantity: '3 kg', price: 180 }], totalAmount: 680, description: 'Weekly grocery', status: 'approved' },
  { type: 'meal', items: [{ name: 'Beef', quantity: '2 kg', price: 400 }, { name: 'Potato', quantity: '4 kg', price: 80 }], totalAmount: 480, description: 'Protein', status: 'approved' },
  { type: 'meal', items: [{ name: 'Onions', quantity: '5 kg', price: 150 }, { name: 'Tomato', quantity: '3 kg', price: 120 }], totalAmount: 270, description: 'Vegetables', status: 'pending' },
  { type: 'flat', items: [{ name: 'Gas bill', quantity: '1 month', price: 1200 }, { name: 'WiFi', quantity: '1 month', price: 800 }], totalAmount: 2000, description: 'Shared utilities', status: 'approved' },
  { type: 'meal', items: [{ name: 'Milk', quantity: '6 L', price: 360 }, { name: 'Bread', quantity: '10 pcs', price: 200 }], totalAmount: 560, description: 'Breakfast', status: 'approved' },
  { type: 'meal', items: [{ name: 'Fruits', quantity: '2 kg', price: 300 }], totalAmount: 300, description: 'Fruits', status: 'pending' },
];

function randomDateInRange(start, end) {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + Math.floor(Math.random() * (e - s + 1)));
}

function generateBazarForMonth(members, admin, monthOffset) {
  const start = getMonthStart(monthOffset);
  const end = getMonthEnd(monthOffset);
  const templates = monthOffset === 0 ? bazarTemplatesCurrentMonth : bazarTemplatesLastMonth;
  return templates.map((t, i) => ({
    ...t,
    userId: members[i % members.length]._id,
    date: randomDateInRange(start, end),
    approvedBy: t.status === 'approved' ? admin._id : null,
    approvedAt: t.status === 'approved' ? new Date() : null,
  }));
}

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
    await AdminChangeRequest.deleteMany({});
    await Election.deleteMany({});
    await RemovalRequest.deleteMany({});
    await PaymentRequest.deleteMany({});
    await Refund.deleteMany({});
    await LedgerEntry.deleteMany({});
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
    // Link members to admin so group (getGroupMemberIds) includes them for dashboard/bazar & voting
    if (admin && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members.map(m => m._id) } },
        { $set: { createdBy: admin._id } }
      );
      console.log(`✅ Set createdBy to admin for ${members.length} members`);

      // Seed a sample pending admin-change vote so UI can show an in-progress election
      if (members.length >= 2) {
        const candidate = members[1]; // e.g. Mahbub Alam from sample users
        const initiator = members[0]; // e.g. John Doe
        const voteRequest = await AdminChangeRequest.create({
          groupAdminId: admin._id,
          candidateId: candidate._id,
          createdBy: initiator._id,
          status: 'pending',
          votes: [
            {
              voter: initiator._id,
              votedAt: new Date(),
            },
          ],
        });
        console.log(
          `✅ Seeded admin change request ${voteRequest._id} (candidate: ${candidate.email}, createdBy: ${initiator.email})`
        );
      }

      // Seed a sample election (accepting_candidates) so admin can start it and members can apply/vote
      const sampleElection = await Election.create({
        groupAdminId: admin._id,
        status: 'accepting_candidates',
        electionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        arrangedBy: admin._id,
        candidates: [{ userId: members[0]._id, appliedAt: new Date() }],
      });
      console.log(
        `✅ Seeded election ${sampleElection._id} (accepting_candidates, 1 candidate applied)`
      );

      // Seed sample removal requests for new removalRequests feature
      const removalRequests = [];
      const firstMember = members[0];
      const secondMember = members[1] || members[0];

      if (firstMember) {
        removalRequests.push({
          userId: firstMember._id,
          type: 'member_leave',
          requestedBy: firstMember._id,
          status: 'pending',
        });
      }

      if (secondMember) {
        removalRequests.push({
          userId: secondMember._id,
          type: 'member_leave',
          requestedBy: secondMember._id,
          status: 'accepted',
          resolvedAt: new Date(),
          resolvedBy: admin._id,
        });
      }

      removalRequests.push({
        userId: admin._id,
        type: 'admin_removal',
        requestedBy: firstMember ? firstMember._id : admin._id,
        status: 'rejected',
        resolvedAt: new Date(),
        resolvedBy: admin._id,
      });

      if (removalRequests.length > 0) {
        const createdRemovalRequests = await RemovalRequest.insertMany(removalRequests);
        console.log(`✅ Seeded ${createdRemovalRequests.length} removal requests`);
      }
    }

    // Create bazar entries: original samples + last month + current month (for full feature testing)
    const now = new Date();
    const bazarSamples = sampleBazarEntries.map((entry, idx) => ({
      ...entry,
      type: entry.type || 'meal',
      userId: members[idx % members.length]._id,
      date: new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
      approvedBy: entry.status === 'approved' ? admin._id : null,
      approvedAt: entry.status === 'approved' ? new Date() : null
    }));
    const bazarLastMonth = generateBazarForMonth(members, admin, -1);
    const bazarCurrentMonth = generateBazarForMonth(members, admin, 0);
    const bazarData = [...bazarSamples, ...bazarLastMonth, ...bazarCurrentMonth];
    await Bazar.insertMany(bazarData);
    console.log(`✅ Created ${bazarData.length} bazar entries (samples + last month + current month)`);

    // Create meals
    const meals = generateMealEntries(members, admin);
    await Meal.insertMany(meals);
    console.log(`✅ Created ${meals.length} meal entries`);

    // Payment requests: pending (admin can approve/reject), approved, rejected
    const member0 = members[0];
    const member1 = members[1];
    const paymentRequestDocs = [
      { userId: member1._id, amount: 5000, type: 'full_due', status: 'pending', method: 'mobile_banking', notes: 'Monthly due', requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { userId: member0._id, amount: 5000, type: 'full_due', status: 'approved', method: 'cash', notes: 'Paid', requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), approvedAt: new Date(), approvedBy: admin._id },
      { userId: member1._id, amount: 2000, type: 'custom', status: 'rejected', method: 'bank_transfer', notes: 'Partial', requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), approvedAt: new Date(), approvedBy: admin._id, rejectionNote: 'Please pay full due first' },
    ];
    const createdPaymentRequests = await PaymentRequest.insertMany(paymentRequestDocs);
    console.log(`✅ Created ${createdPaymentRequests.length} payment requests`);

    // Refunds: one sent (member can acknowledge), one acknowledged
    const refundDocs = [
      { userId: member0._id, amount: 500, status: 'sent', method: 'cash', notes: 'Overpayment refund', sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), sentBy: admin._id },
      { userId: member1._id, amount: 300, status: 'acknowledged', method: 'mobile_banking', notes: 'Refund received', sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), sentBy: admin._id, acknowledgedAt: new Date() },
    ];
    const createdRefunds = await Refund.insertMany(refundDocs);
    console.log(`✅ Created ${createdRefunds.length} refunds`);

    // Ledger entries for transparency (refIds from inserted payment/refund docs)
    const approvedReq = createdPaymentRequests.find(r => r.status === 'approved');
    const sentRefund = createdRefunds.find(r => r.status === 'sent');
    const ledgerEntries = [];
    if (approvedReq) ledgerEntries.push({ groupId: admin._id, userId: member0._id, type: 'payment_recorded', amount: 5000, refType: 'PaymentRequest', refId: approvedReq._id, description: 'Payment recorded' });
    if (sentRefund) ledgerEntries.push({ groupId: admin._id, userId: member0._id, type: 'refund_sent', amount: 500, refType: 'Refund', refId: sentRefund._id, description: 'Refund sent' });
    if (ledgerEntries.length > 0) {
      await LedgerEntry.insertMany(ledgerEntries);
      console.log(`✅ Created ${ledgerEntries.length} ledger entries`);
    }

    // Initialize statistics using model static methods to stay in sync with dashboard/reports
    await Statistics.updateAllStatistics();
    await Statistics.updateMonthlyStatistics();
    console.log('✅ Statistics initialized via aggregations');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(seedDatabase);
