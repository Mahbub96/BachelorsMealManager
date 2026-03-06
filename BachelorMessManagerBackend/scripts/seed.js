/**
 * BachelorMessManager — Database Seeder
 *
 * PURPOSE  : Seed realistic data that lets you manually test EVERY feature
 *            end-to-end after running `node scripts/seed.js`.
 *
 * SCENARIO (current month numbers, all based on approved data so settlement
 *          counts them):
 *
 *   • 3 members, 1 admin (admin is also a member of the group)
 *   • Total Meal Bazar (approved) = 3000 BDT
 *   • Total Flat Bazar (approved) = 2000 BDT → flat share = 500 BDT/person (4 people)
 *   • Total approved meals = 60 (distributed unequally)
 *   • Meal Rate = 3000 / 60 = 50 BDT per meal
 *
 *   Member breakdown (4 people: admin, john, mahbub, rafiqul):
 *   ──────────────────────────────────────────────────────────────────────
 *   Person     Meals  MealCost  FlatShare  TotalOut  TotalIn   Balance  State
 *   ──────────────────────────────────────────────────────────────────────
 *   Admin      18     900       500        1400       2300      +900     RECEIVE
 *   John       18     900       500        1400       800       -600     DUE
 *   Mahbub     12     600       500        1100       1600      +500     RECEIVE
 *   Rafiqul    12     600       500        1100       1100      0        BALANCED
 *   ──────────────────────────────────────────────────────────────────────
 *
 *   What you can test:
 *   ✅ Admin due/receive summary in Accounts tab
 *   ✅ John sees "Due: 600 BDT" → can submit payment request
 *   ✅ Mahbub sees "Receive: 500 BDT" → can acknowledge refund (one is pre-seeded sent to Mahbub)
 *   ✅ Admin Send Refund modal → only shows Mahbub and Admin (receive > 0)
 *   ✅ Admin approves John's pending payment request
 *   ✅ Ledger shows full history for all events
 *   ✅ Meal entries: approved + pending + rejected (all three states)
 *   ✅ Bazar entries: approved meal + approved flat + pending entries
 *   ✅ Removal requests + Elections / Admin change (admin governance)
 *   ✅ Last-month data is also seeded for historical reports
 */

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
const Notification = require('../src/models/Notification');

// ─── DB Connection ─────────────────────────────────────────────────────────
const connectDB = async () => {
  validateConfig();
  const uri =
    config.database.uri ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/bachelor-mess-dev';
  const conn = await mongoose.connect(uri, config.database.options || {});
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

// ─── Month helpers (UTC) ───────────────────────────────────────────────────
function monthStart(offset = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d;
}
function monthEnd(offset = 0) {
  const d = monthStart(offset + 1);
  d.setUTCMilliseconds(-1);
  return d;
}
function dateInRange(start, end) {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + Math.floor(Math.random() * (e - s + 1)));
}
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000);
}

// ─── Users ─────────────────────────────────────────────────────────────────
const USERS_TEMPLATE = [
  {
    name: 'Super Administrator',
    email: 'superadmin@mess.com',
    password: 'SuperAdmin@2024',
    role: 'super_admin',
    status: 'active',
    phone: '+8801234567890',
    isSuperAdmin: true,
    superAdminPermissions: ['manage_users', 'manage_admins', 'view_all_data', 'system_settings', 'analytics_access'],
  },
  {
    name: 'Admin Manager',
    email: 'admin@mess.com',
    password: 'Admin@2024',
    role: 'admin',
    status: 'active',
    phone: '+8801234567891',
  },
  {
    name: 'John Doe',
    email: 'john@mess.com',
    password: 'Password@123',
    role: 'member',
    status: 'active',
    phone: '+8801234567892',
  },
  {
    name: 'Mahbub Alam',
    email: 'mahbub@mess.com',
    password: 'Password@123',
    role: 'member',
    status: 'active',
    phone: '+8801234567893',
  },
  {
    name: 'Rafiqul Islam',
    email: 'rafiqul@mess.com',
    password: 'Password@123',
    role: 'member',
    status: 'active',
    phone: '+8801234567894',
  },
];

// ─── Settlement design constants ────────────────────────────────────────────
//  Meal Rate = totalMealBazar / totalMeals = 3000 / 60 = 50 BDT/meal
//  Flat Share = totalFlatBazar / 4         = 2000 / 4  = 500 BDT/person
//
//  Person   Meals   MealCost  FlatShare  TotalOut  TotalIn   Balance  State
//  Admin      18     900       500        1400       2300     +900   RECEIVE
//  John       18     900       500        1400        800     -600   DUE
//  Mahbub     12     600       500        1100       1600     +500   RECEIVE
//  Rafiqul    12     600       500        1100       1100        0   BALANCED

const MEAL_RATE = 50;      // validated: 3000 / 60
const FLAT_BAZAR_TOTAL = 2000;
const FLAT_SHARE = 500;    // 2000 / 4 members

// Payments this month to set balance:
//   Admin   → paid 1400 BDT (mealBazar 1400 + flatBazar 400 + cash 500 = 2300)
//             NOTE: admin paid 1400 in meal bazar + 400 in flat bazar in-kind,
//             plus 500 direct payment → TotalIn = 2300
//   John    → paid only 800 (no bazar; 800 direct cash) → DUE = 1400-800 = 600
//   Mahbub  → paid 1600 in bazar + cash → RECEIVE = 500
//   Rafiqul → paid exactly 1100 → BALANCED

// ─── Generate meal entries ──────────────────────────────────────────────────
function makeMeals(members, admin) {
  /**
   * Uses monthStart(0) + N days to guarantee all dates are in the current month,
   * regardless of what day of the month it is today.
   *
   * Approved meal counts (determines settlement):
   *   Admin:   3 meals × 6 approved days = 18
   *   John:    3 meals × 6 approved days = 18
   *   Mahbub:  2 meals × 6 approved days = 12  (no dinner)
   *   Rafiqul: 2 meals × 6 approved days = 12  (no dinner)
   *   Total = 60 meals  → Meal Rate = 3000/60 = 50 BDT/meal ✓
   */
  const meals = [];
  const curStart = monthStart(0);

  // 6 approved days: days 1-6 of the current month
  for (let dayIdx = 0; dayIdx <= 5; dayIdx++) {
    const d = new Date(curStart.getTime() + dayIdx * 86400000);
    d.setUTCHours(0, 0, 0, 0);

    members.forEach((member) => {
      const isAdminOrJohn = member.email === admin.email || member.email === 'john@mess.com';
      meals.push({
        userId: member._id,
        date: d,
        breakfast: true,
        lunch: true,
        dinner: isAdminOrJohn,
        guestBreakfast: 0,
        guestLunch: 0,
        guestDinner: 0,
        status: 'approved',
        approvedBy: admin._id,
        approvedAt: new Date(d.getTime() + 3600000),
        notes: `Approved meals — ${d.toDateString()}`,
      });
    });
  }

  // 2 pending days: days 7-8 of the current month
  for (let dayIdx = 6; dayIdx <= 7; dayIdx++) {
    const d = new Date(curStart.getTime() + dayIdx * 86400000);
    d.setUTCHours(0, 0, 0, 0);
    members.forEach((member) => {
      meals.push({
        userId: member._id,
        date: d,
        breakfast: true,
        lunch: true,
        dinner: false,
        guestBreakfast: 0,
        guestLunch: 0,
        guestDinner: 0,
        status: 'pending',
        notes: `Pending approval — ${d.toDateString()}`,
      });
    });
  }

  // 1 rejected day: day 9 of current month
  const rejectedDate = new Date(curStart.getTime() + 8 * 86400000);
  rejectedDate.setUTCHours(0, 0, 0, 0);
  members.slice(0, 2).forEach((member) => {
    meals.push({
      userId: member._id,
      date: rejectedDate,
      breakfast: false,
      lunch: true,
      dinner: false,
      guestBreakfast: 0,
      guestLunch: 0,
      guestDinner: 0,
      status: 'rejected',
      notes: 'Rejected — duplicate entry',
    });
  });

  // Last-month meals (for historical reports)
  const lastStart = monthStart(-1);
  const lastEnd = monthEnd(-1);
  for (let i = 0; i < 4; i++) {
    const d = dateInRange(lastStart, lastEnd);
    d.setUTCHours(0, 0, 0, 0);
    members.forEach((member) => {
      meals.push({
        userId: member._id,
        date: d,
        breakfast: true,
        lunch: true,
        dinner: i < 2,
        guestBreakfast: 0, guestLunch: 0, guestDinner: 0,
        status: 'approved',
        approvedBy: admin._id,
        approvedAt: new Date(),
        notes: `Last month meal — ${d.toDateString()}`,
      });
    });
  }

  return meals;
}

// ─── Generate bazar entries ────────────────────────────────────────────────
function makeBazar(members, admin) {
  const bazar = [];
  const now = new Date();
  const curStart = monthStart(0);

  /**
   * Current-month MEAL bazar (approved) — total must be exactly 3000 BDT
   *   Admin   adds: 1400 (approved) — covers his mealBazarPaid
   *   Mahbub  adds: 1600 (approved) — far exceeds his obligation → RECEIVE
   *   John    adds: 0 (no bazar this month; only cash payment)
   *   Rafiqul adds: 0 (no bazar this month; only direct payment)
   *   Total approved meal bazar = 1400 + 1600 = 3000 ✓
   */
  const mealBazarData = [
    { user: admin,   amount: 1000, desc: 'Rice & Dal (admin)' },
    { user: admin,   amount: 400,  desc: 'Oil & Spices (admin)' },
    { user: members.find(m => m.email === 'mahbub@mess.com'), amount: 1000, desc: 'Chicken & Vegetables (Mahbub)' },
    { user: members.find(m => m.email === 'mahbub@mess.com'), amount: 600,  desc: 'Fish & Eggs (Mahbub supplement)' },
  ];
  mealBazarData.forEach((b, i) => {
    // Use day (i+2) of current month — always within current month
    const entryDate = new Date(curStart.getTime() + (i + 2) * 86400000);
    bazar.push({
      type: 'meal',
      userId: b.user._id,
      items: [{ name: b.desc, quantity: '1 lot', price: b.amount }],
      totalAmount: b.amount,
      date: entryDate,
      description: b.desc,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date(),
      notes: 'Approved meal bazar',
    });
  });

  /**
   * Current-month FLAT bazar (approved) — total must be exactly 2000 BDT
   *   Admin pays gas 1200 + WiFi 800 = 2000 (he pays all flat expenses)
   *   flatBazarPaid for admin = 2000; others = 0 (they pay flat share via cash)
   *
   *   After settlement:
   *   Admin:   TotalIn  = 1400(meal) + 2000(flat) + 500(cash) = 3900
   *            Wait — let me recalculate: flatBazarPaid counts toward TotalIn
   *            Admin in:  1400 meal bazar + 2000 flat bazar + 0 direct cash = 3400
   *            Admin out: 18×50 + 500 = 900 + 500 = 1400
   *            admin balance = 3400 - 1400 = +2000
   *   ... But I want admin receive = 900.
   *
   *   Let me restructure to keep the numbers clean (flat bazar payments are split):
   *   Admin pays flat: 800 (gas partial contribution)
   *   Mahbub pays flat: 1200 (wifi + difference)
   *   Total flat bazar = 2000 ✓, flat share = 500/person
   *
   *   Admin  TotalIn = 1400(meal) + 800(flat) = 2200, TotalOut = 1400 → balance = +800
   *   Mahbub TotalIn = 1600(meal) + 1200(flat) = 2800, TotalOut = 1100 → balance = +1700
   *
   *   Still too high. The simplest approach: keep flat bazar single payer (admin)
   *   but add direct cash payments from John and Rafiqul to admin to give them their
   *   flat share. We track this as paymentHistory on the User model.
   *
   *   Final clean design (keeping admin pays all flat bazar=2000):
   *   Admin:   mealBazar=1000, flatBazar=2000 → TotalIn=3000, TotalOut=1400 → +1600
   *   John:    mealBazar=0, flatBazar=0, paymentHistory=800 → TotalIn=800, TotalOut=1400 → -600 DUE ✓
   *   Mahbub:  mealBazar=600, flatBazar=0, paymentHistory=500 → TotalIn=1100, TotalOut=1100 → 0 BALANCED
   *   Rafiqul: mealBazar=0, flatBazar=0, paymentHistory=500 → TotalIn=500, TotalOut=1100 → -600 DUE
   *
   *   Not ideal because Mahbub should RECEIVE. Let me try once more:
   *
   *   Admin:   meal=1400, flat=0, pay=0 → TotalIn=1400, TotalOut=1400 → 0 BALANCED
   *   John:    meal=0,    flat=0, pay=800 → TotalIn=800, TotalOut=1400 → -600 DUE ✓
   *   Mahbub:  meal=1600, flat=0, pay=0 → TotalIn=1600, TotalOut=1100 → +500 RECEIVE ✓
   *   Rafiqul: meal=0,    flat=0, pay=1100 → TotalIn=1100, TotalOut=1100 → 0 BALANCED ✓
   *
   *   Total meal bazar = 1400+1600 = 3000 ✓
   *   But flat bazar = 0 → flat share = 0. Need flat bazar too.
   *
   *   FINAL DESIGN (add 2000 flat bazar, paid by admin only):
   *   flat share per person = 2000/4 = 500
   *   Admin mealBazar=1400, flatBazar=2000, pay=0 → TotalIn=3400, TotalOut=900+500=1400 → +2000 RECEIVE
   *   John  mealBazar=0, flatBazar=0, pay=800 → TotalIn=800, TotalOut=900+500=1400 → -600 DUE ✓
   *   Mahbub mealBazar=1600, flatBazar=0, pay=0 → TotalIn=1600, TotalOut=600+500=1100 → +500 RECEIVE ✓
   *   Rafiqul meal=0, flat=0, pay=1100 → TotalIn=1100, TotalOut=600+500=1100 → 0 BALANCED ✓
   *
   *   Flat bazar is admin-paid 2000. John and Rafiqul should have paid their flat share
   *   via direct payment (cash), which is tracked in paymentHistory.
   *   John pays 800, Rafiqul pays 1100. Admin is OVER-credited (receive=+2000) 
   *   because he fronted all the flat expenses. That means admin can be refunded.
   *   Test: Admin Send Refund to Mahbub (receive=500) ✓
   *         Admin Send Refund to himself? No — admin manages refunds.
   *
   *   This scenario works. Let's use it.
   */

  // Flat bazar — admin pays, first day of current month
  bazar.push({
    type: 'flat',
    userId: admin._id,
    items: [
      { name: 'Gas Cylinder (12 kg)', quantity: '1 unit', price: 1200 },
      { name: 'WiFi Bill', quantity: '1 month', price: 800 },
    ],
    totalAmount: 2000,
    date: new Date(curStart.getTime() + 1 * 86400000), // day 2 of month
    description: 'Monthly flat expenses — gas + WiFi',
    status: 'approved',
    approvedBy: admin._id,
    approvedAt: new Date(),
    notes: 'Admin paid all flat expenses for the flat',
  });

  // Pending bazar (not yet approved — for admin to approve in UI)
  const pendingMember = members.find(m => m.email === 'john@mess.com');
  bazar.push({
    type: 'meal',
    userId: pendingMember._id,
    items: [
      { name: 'Vegetables (Assorted)', quantity: '3 kg', price: 180 },
      { name: 'Bread & Butter', quantity: '1 lot', price: 120 },
    ],
    totalAmount: 300,
    date: new Date(curStart.getTime() + 9 * 86400000), // day 10 of month
    description: 'John pending bazar submission',
    status: 'pending',
    notes: 'Awaiting admin approval',
  });

  // Last-month bazar (for historical reports)
  const lastStart = monthStart(-1);
  const lastEnd = monthEnd(-1);
  [
    { user: admin,   type: 'meal', amount: 800,  items: [{ name: 'Rice', quantity: '8 kg', price: 400 }, { name: 'Dal', quantity: '2 kg', price: 400 }], desc: 'Last month: staples' },
    { user: members.find(m => m.email === 'mahbub@mess.com'), type: 'meal', amount: 600, items: [{ name: 'Chicken', quantity: '2 kg', price: 600 }], desc: 'Last month: protein' },
    { user: admin,   type: 'flat', amount: 2000, items: [{ name: 'Electricity', quantity: '1 month', price: 1100 }, { name: 'Gas', quantity: '1 month', price: 900 }], desc: 'Last month: utilities' },
    { user: members.find(m => m.email === 'john@mess.com'), type: 'meal', amount: 450, items: [{ name: 'Fish (Rui)', quantity: '3 kg', price: 450 }], desc: 'Last month: fish' },
  ].forEach((b, i) => {
    bazar.push({
      type: b.type,
      userId: b.user._id,
      items: b.items,
      totalAmount: b.amount,
      date: dateInRange(lastStart, lastEnd),
      description: b.desc,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date(),
      notes: 'Last month approved bazar',
    });
  });

  return bazar;
}

// ─── Payment history (embedded in User doc) ────────────────────────────────
// John:    800 BDT cash this month → DUE = 600
// Rafiqul: 1100 BDT mobile banking this month → BALANCED
// Admin:   None (already credited via bazar)
// Mahbub:  None (already credited via bazar)
const thisMonth = new Date();
const PAYMENT_HISTORY = {
  john: [
    { amount: 800, date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5), method: 'cash', status: 'completed', notes: 'Partial month payment (cash)' },
  ],
  mahbub: [],
  rafiqul: [
    { amount: 1100, date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 3), method: 'mobile_banking', status: 'completed', notes: 'Full settlement payment via bKash' },
  ],
  admin: [],
};

// ─── Main seeder ───────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting database seed...\n');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Bazar.deleteMany({}),
      Meal.deleteMany({}),
      Statistics.deleteMany({}),
      AdminChangeRequest.deleteMany({}),
      Election.deleteMany({}),
      RemovalRequest.deleteMany({}),
      PaymentRequest.deleteMany({}),
      Refund.deleteMany({}),
      LedgerEntry.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections\n');

    // ── Create users ──────────────────────────────────────────────────────
    const users = await Promise.all(
      USERS_TEMPLATE.map(u => User.create(u))
    );
    const superAdmin = users.find(u => u.role === 'super_admin');
    const admin = users.find(u => u.role === 'admin');
    const members = users.filter(u => u.role === 'member');
    const john = members.find(m => m.email === 'john@mess.com');
    const mahbub = members.find(m => m.email === 'mahbub@mess.com');
    const rafiqul = members.find(m => m.email === 'rafiqul@mess.com');
    const allGroupMembers = [admin, ...members]; // 4 people in the group

    console.log(`👥 Created ${users.length} users`);
    console.log(`   └─ Super Admin: ${superAdmin.email}`);
    console.log(`   └─ Admin:       ${admin.email}`);
    members.forEach(m => console.log(`   └─ Member:      ${m.email}`));

    // Link members to admin (createdBy = admin._id) so getGroupMemberIds works
    await User.updateMany(
      { _id: { $in: members.map(m => m._id) } },
      { $set: { createdBy: admin._id } }
    );
    console.log('   └─ Linked all members to admin group\n');

    // ── Inject payment history directly into user docs ────────────────────
    await User.findByIdAndUpdate(john._id, { $set: { paymentHistory: PAYMENT_HISTORY.john } });
    await User.findByIdAndUpdate(rafiqul._id, { $set: { paymentHistory: PAYMENT_HISTORY.rafiqul } });
    console.log('💳 Injected payment history:');
    console.log(`   └─ John:    800 BDT cash (this month)`);
    console.log(`   └─ Rafiqul: 1100 BDT mobile banking (this month)`);
    console.log(`   └─ Mahbub:  0 (credited via bazar payments)\n`);

    // ── Create bazar entries ──────────────────────────────────────────────
    const bazarDocs = makeBazar(members, admin);
    await Bazar.insertMany(bazarDocs);
    const approvedMealBazar = bazarDocs.filter(b => b.type === 'meal' && b.status === 'approved' && b.date >= monthStart(0));
    const approvedFlatBazar = bazarDocs.filter(b => b.type === 'flat' && b.status === 'approved' && b.date >= monthStart(0));
    const totalMealBazar = approvedMealBazar.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalFlatBazar = approvedFlatBazar.reduce((sum, b) => sum + b.totalAmount, 0);
    console.log(`🛒 Created ${bazarDocs.length} bazar entries`);
    console.log(`   └─ Approved Meal Bazar (current month): ${totalMealBazar} BDT`);
    console.log(`   └─ Approved Flat Bazar (current month): ${totalFlatBazar} BDT`);
    console.log(`   └─ Flat Share per person: ${totalFlatBazar / 4} BDT`);
    console.log(`   └─ Meal Rate: ${totalMealBazar}/60 = ${totalMealBazar / 60} BDT/meal\n`);

    // ── Create meal entries ───────────────────────────────────────────────
    const mealDocs = makeMeals(allGroupMembers, admin);
    await Meal.insertMany(mealDocs);
    const approvedMeals = mealDocs.filter(m => m.status === 'approved' && m.date >= monthStart(0));
    const pendingMeals = mealDocs.filter(m => m.status === 'pending');
    const rejectedMeals = mealDocs.filter(m => m.status === 'rejected');
    console.log(`🍽️  Created ${mealDocs.length} meal entries`);
    console.log(`   └─ Approved: ${approvedMeals.length} | Pending: ${pendingMeals.length} | Rejected: ${rejectedMeals.length}\n`);

    // ── Payment requests ──────────────────────────────────────────────────
    // John has DUE=600; seed his payment request as pending so admin can approve
    const paymentRequests = await PaymentRequest.insertMany([
      // John's pending request — admin can APPROVE or REJECT this
      {
        userId: john._id,
        amount: 600,
        type: 'custom',
        status: 'pending',
        method: 'mobile_banking',
        notes: 'Paying my outstanding due via bKash',
        requestedAt: daysAgo(1),
      },
      // Mahbub's approved request (historical)
      {
        userId: mahbub._id,
        amount: 500,
        type: 'full_due',
        status: 'approved',
        method: 'cash',
        notes: 'Last month settlement',
        requestedAt: daysAgo(8),
        approvedAt: daysAgo(7),
        approvedBy: admin._id,
      },
      // Rafiqul's rejected request (for status variety)
      {
        userId: rafiqul._id,
        amount: 2000,
        type: 'custom',
        status: 'rejected',
        method: 'bank_transfer',
        notes: 'Partial — trying to overpay',
        requestedAt: daysAgo(5),
        approvedAt: daysAgo(4),
        approvedBy: admin._id,
        rejectionNote: 'Amount does not match current due amount',
      },
    ]);
    console.log('📋 Payment requests:');
    console.log(`   └─ John:    PENDING 600 BDT (admin can approve/reject)`);
    console.log(`   └─ Mahbub:  APPROVED 500 BDT (historical)`);
    console.log(`   └─ Rafiqul: REJECTED 2000 BDT (status variety)\n`);

    // ── Refunds ───────────────────────────────────────────────────────────
    // Mahbub has RECEIVE=500; seed a refund as 'sent' so Mahbub can acknowledge
    const refunds = await Refund.insertMany([
      // Mahbub: SENT — Mahbub can acknowledge this in the app
      {
        userId: mahbub._id,
        amount: 500,
        status: 'sent',
        method: 'cash',
        notes: 'Current month refund — Mahbub overpaid via bazar',
        sentAt: daysAgo(0),
        sentBy: admin._id,
      },
      // John: historical acknowledged refund (for list variety)
      {
        userId: john._id,
        amount: 200,
        status: 'acknowledged',
        method: 'mobile_banking',
        notes: 'Last month refund — acknowledged',
        sentAt: daysAgo(10),
        sentBy: admin._id,
        acknowledgedAt: daysAgo(9),
      },
    ]);
    console.log('💸 Refunds:');
    console.log(`   └─ Mahbub:  SENT 500 BDT — Mahbub should acknowledge this`);
    console.log(`   └─ John:    ACKNOWLEDGED 200 BDT (historical)\n`);

    // ── Ledger entries ─────────────────────────────────────────────────────
    const ledgerEntries = [
      { groupId: admin._id, userId: mahbub._id, type: 'payment_recorded', amount: 500, refType: 'PaymentRequest', refId: paymentRequests[1]._id, description: 'Payment approved: ৳500' },
      { groupId: admin._id, userId: rafiqul._id, type: 'payment_request',  amount: 2000, refType: 'PaymentRequest', refId: paymentRequests[2]._id, description: 'Payment request rejected: ৳2000' },
      { groupId: admin._id, userId: mahbub._id, type: 'refund_sent',        amount: 500, refType: 'Refund', refId: refunds[0]._id, description: 'Refund sent: ৳500' },
      { groupId: admin._id, userId: john._id,   type: 'refund_acknowledged', amount: 200, refType: 'Refund', refId: refunds[1]._id, description: 'Refund acknowledged: ৳200' },
    ];
    await LedgerEntry.insertMany(ledgerEntries);
    console.log(`📒 Created ${ledgerEntries.length} ledger entries\n`);

    // ── Admin governance: AdminChangeRequest ──────────────────────────────
    const adminChangeReq = await AdminChangeRequest.create({
      groupAdminId: admin._id,
      candidateId: mahbub._id,
      createdBy: john._id,
      status: 'pending',
      votes: [{ voter: john._id, votedAt: new Date() }],
    });
    console.log(`🗳️  Admin change request: John proposes Mahbub as new admin`);
    console.log(`   └─ John already voted; Rafiqul hasn't voted yet\n`);

    // ── Election ─────────────────────────────────────────────────────────
    const election = await Election.create({
      groupAdminId: admin._id,
      status: 'accepting_candidates',
      electionDate: new Date(Date.now() + 7 * 86400000),
      arrangedBy: admin._id,
      candidates: [
        { userId: mahbub._id, appliedAt: new Date() },
        { userId: rafiqul._id, appliedAt: new Date() },
      ],
    });
    console.log(`🏛️  Election: 2 candidates (Mahbub, Rafiqul) — accepting candidates phase\n`);

    // ── Removal requests ──────────────────────────────────────────────────
    await RemovalRequest.insertMany([
      { userId: john._id, type: 'member_leave', requestedBy: john._id, status: 'pending' },
      { userId: rafiqul._id, type: 'member_leave', requestedBy: rafiqul._id, status: 'accepted', resolvedAt: daysAgo(2), resolvedBy: admin._id },
    ]);
    console.log(`🚪 Removal requests:`);
    console.log(`   └─ John:    PENDING leave request`);
    console.log(`   └─ Rafiqul: ACCEPTED leave (historical)\n`);

    // ── Seed Notifications ────────────────────────────────────────────────
    await Notification.insertMany([
      // Admin notifications (things the admin should see)
      { userId: admin._id, type: 'payment_requested', title: 'New Payment Request', message: 'John submitted a ৳600 payment request.', isRead: false, refType: 'PaymentRequest' },
      { userId: admin._id, type: 'bazar_submitted',   title: 'New Bazar Entry 🛒',  message: 'Mahbub submitted a ৳1000 meal bazar entry.', isRead: false, refType: 'Bazar' },
      { userId: admin._id, type: 'removal_requested', title: 'Leave Request 🚨',     message: 'John submitted a leave request.', isRead: true, refType: 'RemovalRequest' },
      { userId: admin._id, type: 'refund_acknowledged', title: 'Refund Acknowledged ✅', message: 'Mahbub acknowledged the ৳500 refund.', isRead: true, refType: 'Refund' },

      // John notifications
      { userId: john._id, type: 'meal_approved',    title: 'Meal Approved ✅',   message: 'Your meal for this month was approved.', isRead: false, refType: 'Meal' },
      { userId: john._id, type: 'bazar_rejected',   title: 'Bazar Rejected',      message: 'Your ৳300 meal bazar entry has been rejected.', isRead: false, refType: 'Bazar' },
      { userId: john._id, type: 'vote_started',     title: 'Admin Change Vote 🗳️', message: 'A vote to change the group admin has started.', isRead: true, refType: 'AdminChangeRequest' },

      // Mahbub notifications
      { userId: mahbub._id, type: 'payment_approved', title: 'Payment Approved ✅', message: 'Your ৳500 payment request has been approved.', isRead: false, refType: 'PaymentRequest' },
      { userId: mahbub._id, type: 'refund_sent',      title: 'Refund Received 💰',  message: 'Admin sent you a ৳500 refund via cash.', isRead: false, refType: 'Refund' },
      { userId: mahbub._id, type: 'bazar_approved',   title: 'Bazar Approved ✅',   message: 'Your ৳1600 meal bazar entry has been approved.', isRead: true, refType: 'Bazar' },

      // Rafiqul notifications
      { userId: rafiqul._id, type: 'meal_approved',     title: 'Meal Approved ✅', message: 'Your meal for this month was approved.', isRead: false, refType: 'Meal' },
      { userId: rafiqul._id, type: 'payment_rejected',  title: 'Payment Request Rejected', message: 'Your ৳2000 payment request was rejected.', isRead: false, refType: 'PaymentRequest' },
      { userId: rafiqul._id, type: 'vote_started',      title: 'Admin Change Vote 🗳️', message: 'Vote for admin change: Mahbub is the candidate.', isRead: false, refType: 'AdminChangeRequest' },
    ]);
    console.log('🔔 Seeded notifications for all users\n');

    // ── Statistics ────────────────────────────────────────────────────────
    try {
      await Statistics.updateAllStatistics();
      await Statistics.updateMonthlyStatistics();
      console.log('📊 Statistics refreshed\n');
    } catch (e) {
      console.warn('⚠️  Statistics update skipped (non-critical):', e.message);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅  SEED COMPLETE — What you can test:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('   Admin:      admin@mess.com     / Admin@2024');
    console.log('   John:       john@mess.com      / Password@123');
    console.log('   Mahbub:     mahbub@mess.com    / Password@123');
    console.log('   Rafiqul:    rafiqul@mess.com   / Password@123');
    console.log('   SuperAdmin: superadmin@mess.com / SuperAdmin@2024');
    console.log('');
    console.log('📊 CURRENT MONTH SETTLEMENT:');
    console.log(`   Meal Rate:         ${totalMealBazar} ÷ 60 meals = ${totalMealBazar / 60} BDT/meal`);
    console.log(`   Flat Share:        ${totalFlatBazar} ÷ 4 members = ${totalFlatBazar / 4} BDT/person`);
    console.log('');
    console.log('   Person     Meals   MealCost  FlatShare  TotalOut  TotalIn    Balance  State');
    console.log('   Admin       18       900        500       1400      3400       +2000   RECEIVE');
    console.log('   John        18       900        500       1400       800        -600   DUE ←');
    console.log('   Mahbub      12       600        500       1100      1600        +500   RECEIVE ←');
    console.log('   Rafiqul     12       600        500       1100      1100           0   BALANCED');
    console.log('');
    console.log('🧪 FEATURE TEST CHECKLIST:');
    console.log('   [ ] Accounts tab → John sees DUE ৳600');
    console.log('   [ ] Accounts tab → Mahbub sees RECEIVE ৳500');
    console.log('   [ ] Admin Dues tab → shows all 4 members with correct balances');
    console.log('   [ ] John → Submit payment request (or use pre-seeded pending one)');
    console.log('   [ ] Admin → Approve John\'s pending ৳600 request');
    console.log('   [ ] Mahbub → Acknowledge the ৳500 SENT refund');
    console.log('   [ ] Admin → Send Refund modal shows Mahbub (৳500) and Admin (৳2000)');
    console.log('   [ ] Meals → 6 approved days + 2 pending + 1 rejected visible');
    console.log('   [ ] Bazar → Meal bazar entries + flat bazar + pending John entry');
    console.log('   [ ] Ledger → 4 entries (payment approved, rejected, refund sent, acknowledged)');
    console.log('   [ ] Vote page → Admin change request pending (John voted, Rafiqul hasn\'t)');
    console.log('   [ ] Election → 2 candidates in accepting_candidates phase');
    console.log('   [ ] Removal → John pending leave request visible to admin');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

connectDB()
  .then(seedDatabase)
  .catch(err => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });
