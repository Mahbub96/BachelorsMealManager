const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Meal = require('../src/models/Meal');
const Bazar = require('../src/models/Bazar');

// Use environment variables for database connection
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess';

// Use environment variables for test credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mess.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123';
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || 'MemberPassword123';

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Clear all collections
const clearDatabase = async () => {
  try {
    console.log('🗑️  Clearing database...');

    await User.deleteMany({});
    await Meal.deleteMany({});
    await Bazar.deleteMany({});

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Generate random date within a range
const getRandomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Generate random phone number
const generatePhoneNumber = () => {
  const prefixes = [
    '+880 1712',
    '+880 1713',
    '+880 1714',
    '+880 1715',
    '+880 1716',
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}-${number}`;
};

// Generate random meal data
const generateMealData = (userId, date) => {
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const meals = {};

  mealTypes.forEach(type => {
    meals[type] = Math.random() > 0.3; // 70% chance of having each meal
  });

  return {
    userId: userId,
    date: date,
    breakfast: meals.breakfast,
    lunch: meals.lunch,
    dinner: meals.dinner,
    notes: Math.random() > 0.8 ? 'Special meal today!' : '',
    status: 'approved',
    createdAt: date,
    updatedAt: date,
  };
};

// Generate random bazar data
const generateBazarData = (userId, date) => {
  const items = [
    { name: 'Rice', price: 120, quantity: '5kg' },
    { name: 'Potato', price: 80, quantity: '3kg' },
    { name: 'Onion', price: 60, quantity: '2kg' },
    { name: 'Tomato', price: 100, quantity: '2kg' },
    { name: 'Egg', price: 150, quantity: '30 pieces' },
    { name: 'Chicken', price: 300, quantity: '1kg' },
    { name: 'Fish', price: 400, quantity: '1kg' },
    { name: 'Vegetables', price: 120, quantity: 'Mixed' },
    { name: 'Oil', price: 180, quantity: '1L' },
    { name: 'Salt', price: 20, quantity: '1kg' },
    { name: 'Sugar', price: 90, quantity: '1kg' },
    { name: 'Tea', price: 150, quantity: '250g' },
    { name: 'Milk', price: 80, quantity: '1L' },
    { name: 'Bread', price: 40, quantity: '4 pieces' },
    { name: 'Banana', price: 60, quantity: '1 dozen' },
  ];

  const selectedItems = [];
  const numItems = Math.floor(Math.random() * 5) + 2; // 2-6 items

  for (let i = 0; i < numItems; i++) {
    const item = items[Math.floor(Math.random() * items.length)];
    selectedItems.push({
      name: item.name,
      quantity: item.quantity,
      price: item.price + Math.floor(Math.random() * 20) - 10, // ±10 price variation
    });
  }

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return {
    userId: userId,
    items: selectedItems,
    totalAmount: totalAmount,
    description:
      Math.random() > 0.7 ? 'Weekly grocery shopping' : 'Daily essentials',
    date: date,
    status: 'approved',
    createdAt: date,
    updatedAt: date,
  };
};

// Create admin user
const adminUser = new User({
  name: 'Admin User',
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  role: 'admin',
  status: 'active',
  phone: '+8801712345678',
  joinDate: new Date('2024-01-01'),
  lastLogin: new Date(),
});

// Create member users with secure passwords
const memberUsers = [
  {
    name: 'Rahim Khan',
    email: 'rahim@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345679',
    joinDate: new Date('2024-01-05'),
  },
  {
    name: 'Karim Ahmed',
    email: 'karim@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345680',
    joinDate: new Date('2024-01-10'),
  },
  {
    name: 'Salam Hossain',
    email: 'salam@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345681',
    joinDate: new Date('2024-01-15'),
  },
  {
    name: 'Nazrul Islam',
    email: 'nazrul@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345682',
    joinDate: new Date('2024-01-20'),
  },
  {
    name: 'Momin Ali',
    email: 'momin@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345683',
    joinDate: new Date('2024-01-25'),
  },
  {
    name: 'Jahangir Hossain',
    email: 'jahangir@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'active',
    phone: '+8801712345684',
    joinDate: new Date('2024-01-30'),
  },
  {
    name: 'Aziz Rahman',
    email: 'aziz@mess.com',
    password: MEMBER_PASSWORD,
    role: 'member',
    status: 'inactive',
    phone: '+8801712345685',
    joinDate: new Date('2024-02-01'),
  },
];

// Create dummy users
const createUsers = async () => {
  try {
    console.log('👥 Creating users...');

    // Create admin user
    await adminUser.save();
    console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);

    // Create member users
    const createdMemberUsers = [];
    for (const userDataItem of memberUsers) {
      const user = new User(userDataItem);
      await user.save(); // This will trigger the pre-save middleware for password hashing
      createdMemberUsers.push(user);
    }
    console.log(`✅ Created ${createdMemberUsers.length} member users`);

    return [adminUser, ...createdMemberUsers];
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
};

// Create dummy meals
const createMeals = async users => {
  try {
    console.log('🍽️  Creating meals...');

    const meals = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date();

    // Generate meals for each user for the last 3 months
    for (const user of users) {
      if (user.status === 'inactive') continue; // Skip inactive users

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // 80% chance of having meals on any given day
        if (Math.random() > 0.2) {
          meals.push(generateMealData(user._id, new Date(currentDate)));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const createdMeals = await Meal.insertMany(meals);
    console.log(`✅ Created ${createdMeals.length} meals`);

    return createdMeals;
  } catch (error) {
    console.error('❌ Error creating meals:', error);
    throw error;
  }
};

// Create dummy bazar entries
const createBazarEntries = async users => {
  try {
    console.log('🛒 Creating bazar entries...');

    const bazarEntries = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date();

    // Generate bazar entries for each user
    for (const user of users) {
      if (user.status === 'inactive') continue; // Skip inactive users

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // 30% chance of bazar entry on any given day
        if (Math.random() > 0.7) {
          bazarEntries.push(generateBazarData(user._id, new Date(currentDate)));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const createdBazarEntries = await Bazar.insertMany(bazarEntries);
    console.log(`✅ Created ${createdBazarEntries.length} bazar entries`);

    return createdBazarEntries;
  } catch (error) {
    console.error('❌ Error creating bazar entries:', error);
    throw error;
  }
};

// Generate statistics
const generateStatistics = async () => {
  try {
    console.log('📊 Generating statistics...');

    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ status: 'active' }),
        inactive: await User.countDocuments({ status: 'inactive' }),
        admin: await User.countDocuments({ role: 'admin' }),
        member: await User.countDocuments({ role: 'member' }),
      },
      meals: {
        total: await Meal.countDocuments(),
        approved: await Meal.countDocuments({ status: 'approved' }),
        pending: await Meal.countDocuments({ status: 'pending' }),
        rejected: await Meal.countDocuments({ status: 'rejected' }),
      },
      bazar: {
        total: await Bazar.countDocuments(),
        totalAmount: await Bazar.aggregate([
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]).then(result => result[0]?.total || 0),
        approved: await Bazar.countDocuments({ status: 'approved' }),
        pending: await Bazar.countDocuments({ status: 'pending' }),
        rejected: await Bazar.countDocuments({ status: 'rejected' }),
      },
    };

    console.log('📈 Statistics:');
    console.log(
      `   Users: ${stats.users.total} (${stats.users.active} active, ${stats.users.admin} admin)`
    );
    console.log(
      `   Meals: ${stats.meals.total} (${stats.meals.approved} approved)`
    );
    console.log(
      `   Bazar: ${stats.bazar.total} entries (Total: ৳${stats.bazar.totalAmount})`
    );

    return stats;
  } catch (error) {
    console.error('❌ Error generating statistics:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();

    // Create users
    const users = await createUsers();

    // Create meals
    await createMeals(users);

    // Create bazar entries
    await createBazarEntries(users);

    // Generate and display statistics
    await generateStatistics();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log('   Member: rahim@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Member: karim@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Member: salam@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Member: nazrul@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Member: momin@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Member: jahangir@mess.com / ' + MEMBER_PASSWORD);
    console.log('   Inactive: aziz@mess.com / ' + MEMBER_PASSWORD);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
