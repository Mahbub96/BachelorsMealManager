const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Expense = require('../src/models/Expense');
const Member = require('../src/models/Member');

async function seedComprehensiveData() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Bazar.deleteMany({});
    await Meal.deleteMany({});
    await Expense.deleteMany({});
    await Member.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'admin@bachelor-mess.com',
      password: await bcrypt.hash('SuperAdmin@2024', 12),
      role: 'super_admin',
      phone: '+8801712345678',
      address: 'Dhaka, Bangladesh',
      isActive: true,
      createdAt: new Date('2024-01-01'),
    });
    await superAdmin.save();
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Regular Users
    console.log('👥 Creating regular users...');
    const users = [];
    const userData = [
      { name: 'Ahmed Khan', email: 'ahmed@mess.com', phone: '+8801712345679' },
      { name: 'Rahim Ali', email: 'rahim@mess.com', phone: '+8801712345680' },
      {
        name: 'Fatima Begum',
        email: 'fatima@mess.com',
        phone: '+8801712345681',
      },
      {
        name: 'Karim Hassan',
        email: 'karim@mess.com',
        phone: '+8801712345682',
      },
      {
        name: 'Aisha Rahman',
        email: 'aisha@mess.com',
        phone: '+8801712345683',
      },
    ];

    for (const userInfo of userData) {
      const user = new User({
        ...userInfo,
        password: await bcrypt.hash('User@2024', 12),
        role: 'user',
        address: 'Dhaka, Bangladesh',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      });
      await user.save();
      users.push(user);
      console.log(`✅ User created: ${user.name}`);
    }

    // Create Members
    console.log('🏠 Creating members...');
    const members = [];
    const memberData = [
      {
        name: 'Ahmed Khan',
        room: 'A-101',
        joinDate: new Date('2024-01-01'),
        monthlyFee: 5000,
      },
      {
        name: 'Rahim Ali',
        room: 'A-102',
        joinDate: new Date('2024-01-15'),
        monthlyFee: 5000,
      },
      {
        name: 'Fatima Begum',
        room: 'B-201',
        joinDate: new Date('2024-02-01'),
        monthlyFee: 5500,
      },
      {
        name: 'Karim Hassan',
        room: 'B-202',
        joinDate: new Date('2024-02-15'),
        monthlyFee: 5500,
      },
      {
        name: 'Aisha Rahman',
        room: 'C-301',
        joinDate: new Date('2024-03-01'),
        monthlyFee: 6000,
      },
    ];

    for (let i = 0; i < memberData.length; i++) {
      const member = new Member({
        ...memberData[i],
        userId: users[i]._id,
        status: 'active',
        createdAt: memberData[i].joinDate,
      });
      await member.save();
      members.push(member);
      console.log(`✅ Member created: ${member.name} - Room ${member.room}`);
    }

    // Generate Bazar entries for the last 6 months
    console.log('🛒 Creating bazar entries...');
    const bazarCategories = [
      { name: 'Rice', unit: 'kg', avgPrice: 80 },
      { name: 'Vegetables', unit: 'kg', avgPrice: 60 },
      { name: 'Fish', unit: 'kg', avgPrice: 300 },
      { name: 'Chicken', unit: 'kg', avgPrice: 200 },
      { name: 'Oil', unit: 'liter', avgPrice: 150 },
      { name: 'Spices', unit: 'packet', avgPrice: 50 },
      { name: 'Eggs', unit: 'dozen', avgPrice: 120 },
      { name: 'Milk', unit: 'liter', avgPrice: 100 },
      { name: 'Bread', unit: 'piece', avgPrice: 15 },
      { name: 'Fruits', unit: 'kg', avgPrice: 120 },
    ];

    const currentDate = new Date();
    let bazarCount = 0;

    // Generate data for last 6 months
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - monthOffset,
        1
      );
      const daysInMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      ).getDate();

      // Generate 8-12 bazar entries per month
      const entriesThisMonth = Math.floor(Math.random() * 5) + 8;

      for (let entry = 0; entry < entriesThisMonth; entry++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const entryDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          day
        );

        // Select 3-6 items per bazar entry
        const numItems = Math.floor(Math.random() * 4) + 3;
        const selectedCategories = bazarCategories
          .sort(() => 0.5 - Math.random())
          .slice(0, numItems);

        const items = selectedCategories.map(category => {
          const quantity = Math.floor(Math.random() * 5) + 1;
          const priceVariation = 0.8 + Math.random() * 0.4; // ±20% price variation
          const unitPrice = Math.round(category.avgPrice * priceVariation);
          const totalPrice = quantity * unitPrice;

          return {
            name: category.name,
            quantity,
            unit: category.unit,
            unitPrice,
            totalPrice,
          };
        });

        const totalAmount = items.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const status = Math.random() > 0.2 ? 'approved' : 'pending'; // 80% approved

        const bazarEntry = new Bazar({
          userId: users[Math.floor(Math.random() * users.length)]._id,
          date: entryDate,
          description: `Daily grocery shopping for ${entryDate.toLocaleDateString()}`,
          totalAmount,
          status,
          items,
          itemCount: items.length,
          bazarSummary: {
            itemCount: items.length,
            totalAmount,
            status,
            date: entryDate,
          },
          approvalInfo: {
            status,
            message:
              status === 'approved' ? 'Approved by admin' : 'Pending approval',
          },
          createdAt: new Date(
            entryDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
          ),
        });

        await bazarEntry.save();
        bazarCount++;

        if (bazarCount % 10 === 0) {
          console.log(`✅ Created ${bazarCount} bazar entries...`);
        }
      }
    }
    console.log(`✅ Total ${bazarCount} bazar entries created`);

    // Generate Meal entries for the last 3 months
    console.log('🍽️ Creating meal entries...');
    let mealCount = 0;

    // Generate data for last 3 months
    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - monthOffset,
        1
      );
      const daysInMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const mealDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          day
        );

        // Skip future dates
        if (mealDate > currentDate) continue;

        // Generate meals for each user
        for (const user of users) {
          // 90% chance of having meals on any given day
          if (Math.random() > 0.1) {
            const meal = new Meal({
              userId: user._id,
              date: mealDate,
              breakfast: Math.random() > 0.15, // 85% chance of breakfast
              lunch: Math.random() > 0.1, // 90% chance of lunch
              dinner: Math.random() > 0.2, // 80% chance of dinner
              status: 'approved',
              createdAt: new Date(
                mealDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
              ),
            });

            await meal.save();
            mealCount++;
          }
        }

        if (day % 10 === 0) {
          console.log(`✅ Created meals for ${day} days...`);
        }
      }
    }
    console.log(`✅ Total ${mealCount} meal entries created`);

    // Generate Expense entries for the last 6 months
    console.log('💰 Creating expense entries...');
    const expenseCategories = [
      { name: 'Electricity Bill', avgAmount: 8000, frequency: 'monthly' },
      { name: 'Gas Bill', avgAmount: 3000, frequency: 'monthly' },
      { name: 'Water Bill', avgAmount: 1500, frequency: 'monthly' },
      { name: 'Internet Bill', avgAmount: 2000, frequency: 'monthly' },
      { name: 'Cleaning Service', avgAmount: 5000, frequency: 'monthly' },
      { name: 'Kitchen Maintenance', avgAmount: 3000, frequency: 'quarterly' },
      { name: 'Utensils Replacement', avgAmount: 2000, frequency: 'quarterly' },
      { name: 'Emergency Repairs', avgAmount: 5000, frequency: 'quarterly' },
    ];

    let expenseCount = 0;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - monthOffset,
        1
      );

      for (const category of expenseCategories) {
        let shouldCreate = false;

        if (category.frequency === 'monthly') {
          shouldCreate = true;
        } else if (category.frequency === 'quarterly') {
          // Create every 3 months
          shouldCreate = monthOffset % 3 === 0;
        }

        if (shouldCreate) {
          const amountVariation = 0.8 + Math.random() * 0.4; // ±20% variation
          const amount = Math.round(category.avgAmount * amountVariation);

          const expense = new Expense({
            userId: superAdmin._id,
            category: category.name,
            amount,
            description: `${category.name} for ${monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            date: new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              Math.floor(Math.random() * 28) + 1
            ),
            status: 'approved',
            createdAt: new Date(
              monthDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
            ),
          });

          await expense.save();
          expenseCount++;
        }
      }
    }
    console.log(`✅ Total ${expenseCount} expense entries created`);

    // Summary
    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Data Summary:');
    console.log(`   👥 Users: ${users.length + 1} (including Super Admin)`);
    console.log(`   🏠 Members: ${members.length}`);
    console.log(`   🛒 Bazar Entries: ${bazarCount}`);
    console.log(`   🍽️ Meal Entries: ${mealCount}`);
    console.log(`   💰 Expense Entries: ${expenseCount}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Super Admin: admin@bachelor-mess.com / SuperAdmin@2024`);
    console.log(`   Regular Users: [email]@mess.com / User@2024`);
    console.log('\n✅ The app is now ready with comprehensive sample data!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedComprehensiveData().catch(console.error);
