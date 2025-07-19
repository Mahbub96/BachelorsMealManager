const mongoose = require('mongoose');
const User = require('../src/models/User');
const Meal = require('../src/models/Meal');
const Bazar = require('../src/models/Bazar');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess'
    );
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

// Create dummy users
const createUsers = async () => {
  try {
    console.log('👥 Creating users...');

    const userData = [
      {
        name: 'Mahbub Alam',
        email: 'mahbub@mess.com',
        password: 'Password123',
        phone: '+8801712345678',
        role: 'admin',
        status: 'active',
        joinDate: new Date('2024-01-01'),
        isEmailVerified: true,
      },
      {
        name: 'Rahim Khan',
        email: 'rahim@mess.com',
        password: 'Password123',
        phone: '+8801713456789',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-01-05'),
        isEmailVerified: true,
      },
      {
        name: 'Karim Ahmed',
        email: 'karim@mess.com',
        password: 'Password123',
        phone: '+8801714567890',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-01-10'),
        isEmailVerified: true,
      },
      {
        name: 'Salam Hossain',
        email: 'salam@mess.com',
        password: 'Password123',
        phone: '+8801715678901',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-01-15'),
        isEmailVerified: true,
      },
      {
        name: 'Nazrul Islam',
        email: 'nazrul@mess.com',
        password: 'Password123',
        phone: '+8801716789012',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-01-20'),
        isEmailVerified: true,
      },
      {
        name: 'Momin Ali',
        email: 'momin@mess.com',
        password: 'Password123',
        phone: '+8801712890123',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-02-01'),
        isEmailVerified: true,
      },
      {
        name: 'Jahangir Khan',
        email: 'jahangir@mess.com',
        password: 'Password123',
        phone: '+8801713901234',
        role: 'member',
        status: 'active',
        joinDate: new Date('2024-02-05'),
        isEmailVerified: true,
      },
      {
        name: 'Aziz Rahman',
        email: 'aziz@mess.com',
        password: 'Password123',
        phone: '+8801714012345',
        role: 'member',
        status: 'inactive',
        joinDate: new Date('2024-01-25'),
        isEmailVerified: false,
      },
    ];

    // Create users individually to ensure password hashing
    const createdUsers = [];
    for (const userDataItem of userData) {
      const user = new User(userDataItem);
      await user.save(); // This will trigger the pre-save middleware for password hashing
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} users`);

    return createdUsers;
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
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: mahbub@mess.com / Password123');
    console.log('   Member: rahim@mess.com / Password123');
    console.log('   Member: karim@mess.com / Password123');
    console.log('   Member: salam@mess.com / Password123');
    console.log('   Member: nazrul@mess.com / Password123');
    console.log('   Member: momin@mess.com / Password123');
    console.log('   Member: jahangir@mess.com / Password123');
    console.log('   Inactive: aziz@mess.com / Password123');

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
