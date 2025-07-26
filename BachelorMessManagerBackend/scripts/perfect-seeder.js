const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Meal = require('../src/models/Meal');
const Bazar = require('../src/models/Bazar');
const Statistics = require('../src/models/Statistics');
const UIConfig = require('../src/models/UIConfig');

// Configuration
const config = {
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess',
  clearExisting: process.env.CLEAR_EXISTING !== 'false',
  seedCounts: {
    superAdmins: 1,
    admins: 2,
    members: 15,
    mealsPerUser: 90,
    bazarEntriesPerUser: 20,
  },
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date(),
  },
};

// Utility functions
const utils = {
  randomDate: (start, end) => {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  },
  randomPhone: () => {
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
  },
  randomName: () => {
    const firstNames = [
      'Ahmed',
      'Rahim',
      'Karim',
      'Salam',
      'Nazrul',
      'Momin',
      'Jahangir',
      'Aziz',
      'Fatima',
      'Aisha',
      'Rahima',
      'Salma',
      'Nazia',
      'Mariam',
      'Jahanara',
      'Zara',
    ];
    const lastNames = [
      'Khan',
      'Ahmed',
      'Hossain',
      'Rahman',
      'Ali',
      'Chowdhury',
      'Miah',
      'Sarkar',
      'Begum',
      'Khatun',
      'Bibi',
      'Sultana',
      'Banu',
      'Nahar',
      'Jahan',
      'Ara',
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  },
  randomEmail: name => {
    const domains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'mess.com',
    ];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    return `${cleanName}${randomNum}@${domain}`;
  },
  generateMealData: (userId, date) => {
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const meals = {};
    mealTypes.forEach(type => {
      meals[type] = Math.random() > 0.15;
    });
    if (!meals.breakfast && !meals.lunch && !meals.dinner) {
      meals.lunch = true;
    }
    const status = Math.random() > 0.1 ? 'approved' : 'pending';
    return {
      userId: userId,
      date: date,
      breakfast: meals.breakfast,
      lunch: meals.lunch,
      dinner: meals.dinner,
      status: status,
      notes: Math.random() > 0.9 ? 'Special meal today!' : '',
    };
  },
  generateBazarData: (userId, date) => {
    const bazarItems = [
      { name: 'Rice', avgPrice: 120, unit: 'kg' },
      { name: 'Potato', avgPrice: 80, unit: 'kg' },
      { name: 'Onion', avgPrice: 60, unit: 'kg' },
      { name: 'Tomato', avgPrice: 100, unit: 'kg' },
      { name: 'Egg', avgPrice: 150, unit: 'dozen' },
      { name: 'Chicken', avgPrice: 300, unit: 'kg' },
      { name: 'Fish', avgPrice: 400, unit: 'kg' },
      { name: 'Vegetables', avgPrice: 120, unit: 'mixed' },
      { name: 'Oil', avgPrice: 180, unit: 'liter' },
      { name: 'Salt', avgPrice: 20, unit: 'kg' },
      { name: 'Sugar', avgPrice: 90, unit: 'kg' },
      { name: 'Tea', avgPrice: 150, unit: '250g' },
      { name: 'Milk', avgPrice: 80, unit: 'liter' },
      { name: 'Bread', avgPrice: 40, unit: 'pieces' },
      { name: 'Banana', avgPrice: 60, unit: 'dozen' },
    ];
    const numItems = Math.floor(Math.random() * 6) + 3;
    const selectedItems = [];
    const usedItems = new Set();
    for (let i = 0; i < numItems; i++) {
      let item;
      do {
        item = bazarItems[Math.floor(Math.random() * bazarItems.length)];
      } while (usedItems.has(item.name));
      usedItems.add(item.name);
      const quantity = Math.floor(Math.random() * 5) + 1;
      const priceVariation = 0.8 + Math.random() * 0.4;
      const unitPrice = Math.round(item.avgPrice * priceVariation);
      const totalPrice = quantity * unitPrice;
      selectedItems.push({
        name: item.name,
        quantity: `${quantity} ${item.unit}`,
        price: totalPrice,
      });
    }
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.price,
      0
    );
    const status = Math.random() > 0.2 ? 'approved' : 'pending';
    return {
      userId: userId,
      date: date,
      items: selectedItems,
      totalAmount: totalAmount,
      description:
        Math.random() > 0.7 ? 'Weekly grocery shopping' : 'Daily essentials',
      status: status,
      itemCount: selectedItems.length,
    };
  },
  generatePaymentHistory: (monthlyContribution, startDate) => {
    const payments = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      const paymentDate = new Date(currentDate);
      paymentDate.setDate(
        paymentDate.getDate() + Math.floor(Math.random() * 10)
      );
      if (paymentDate <= new Date()) {
        const methods = ['cash', 'bank_transfer', 'mobile_banking'];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const status = Math.random() > 0.1 ? 'completed' : 'pending';
        payments.push({
          amount: monthlyContribution,
          date: paymentDate,
          method: method,
          status: status,
          notes: `Monthly contribution for ${paymentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        });
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return payments;
  },
  // Fix: Helper to generate valid phone numbers
  validPhone: () => {
    const prefixes = [
      '+8801712',
      '+8801713',
      '+8801714',
      '+8801715',
      '+8801716',
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefix}${number}`;
  },
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('MongoDB connection error');
  }
};

// Clear existing data
const clearDatabase = async () => {
  if (!config.clearExisting) {
    console.log('⏭️  Skipping database clear (CLEAR_EXISTING=false)');
    return;
  }
  try {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Meal.deleteMany({});
    await Bazar.deleteMany({});
    await Statistics.deleteMany({});
    await UIConfig.deleteMany({});
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Create Super Admin
const createSuperAdmin = async () => {
  try {
    console.log('👑 Creating Super Admin...');
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@bachelor-mess.com',
      password: await bcrypt.hash('SuperAdmin@2024', 12),
      phone: utils.validPhone(),
      role: 'super_admin',
      status: 'active',
      joinDate: new Date('2024-01-01'),
      lastLogin: new Date(),
      isEmailVerified: true,
      monthlyContribution: 6000,
      paymentStatus: 'paid',
      totalPaid: 6000,
      paymentHistory: utils.generatePaymentHistory(
        6000,
        new Date('2024-01-01')
      ),
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
      lastSuperAdminAction: new Date(),
      superAdminNotes: 'Initial super admin account',
    });
    await superAdmin.save();
    console.log('✅ Super Admin created:', superAdmin.email);
    return superAdmin;
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
};

// Create Admin Users
const createAdminUsers = async () => {
  try {
    console.log('👨‍💼 Creating Admin Users...');
    const adminData = [
      {
        name: 'Admin Manager',
        email: 'admin@bachelor-mess.com',
        phone: utils.validPhone(),
        monthlyContribution: 5500,
      },
      {
        name: 'Assistant Admin',
        email: 'assistant@bachelor-mess.com',
        phone: utils.validPhone(),
        monthlyContribution: 5500,
      },
    ];
    const admins = [];
    for (const adminInfo of adminData) {
      const admin = new User({
        ...adminInfo,
        password: await bcrypt.hash('Admin@2024', 12),
        role: 'admin',
        status: 'active',
        joinDate: new Date('2024-01-15'),
        lastLogin: new Date(),
        isEmailVerified: true,
        paymentStatus: 'paid',
        totalPaid: 5500,
        paymentHistory: utils.generatePaymentHistory(
          5500,
          new Date('2024-01-15')
        ),
      });
      await admin.save();
      admins.push(admin);
      console.log(`✅ Admin created: ${admin.name} (${admin.email})`);
    }
    return admins;
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    throw error;
  }
};

// Create Member Users
const createMemberUsers = async () => {
  try {
    console.log('👥 Creating Member Users...');
    const members = [];
    const joinDates = [
      new Date('2024-01-01'),
      new Date('2024-01-15'),
      new Date('2024-02-01'),
      new Date('2024-02-15'),
      new Date('2024-03-01'),
      new Date('2024-03-15'),
      new Date('2024-04-01'),
      new Date('2024-04-15'),
      new Date('2024-05-01'),
      new Date('2024-05-15'),
      new Date('2024-06-01'),
      new Date('2024-06-15'),
      new Date('2024-07-01'),
      new Date('2024-07-15'),
      new Date('2024-08-01'),
    ];
    for (let i = 0; i < config.seedCounts.members; i++) {
      const name = utils.randomName();
      const email = utils.randomEmail(name);
      const phone = utils.validPhone();
      const joinDate = joinDates[i] || new Date('2024-01-01');
      const monthlyContribution = 5000 + Math.floor(Math.random() * 1000);
      const status = Math.random() > 0.1 ? 'active' : 'inactive';
      const paymentStatus =
        Math.random() > 0.2
          ? 'paid'
          : Math.random() > 0.5
            ? 'pending'
            : 'overdue';
      const member = new User({
        name: name,
        email: email,
        password: await bcrypt.hash('Member@2024', 12),
        phone: phone,
        role: 'member',
        status: status,
        joinDate: joinDate,
        lastLogin: status === 'active' ? new Date() : null,
        isEmailVerified: Math.random() > 0.2,
        monthlyContribution: monthlyContribution,
        paymentStatus: paymentStatus,
        totalPaid:
          paymentStatus === 'paid'
            ? monthlyContribution
            : Math.floor(monthlyContribution * 0.7),
        paymentHistory: utils.generatePaymentHistory(
          monthlyContribution,
          joinDate
        ),
      });
      await member.save();
      members.push(member);
      console.log(
        `✅ Member created: ${member.name} (${member.email}) - ${member.status}`
      );
    }
    return members;
  } catch (error) {
    console.error('❌ Error creating member users:', error);
    throw error;
  }
};

// Create Meal Entries
const createMealEntries = async users => {
  try {
    console.log('🍽️  Creating Meal Entries...');
    const meals = [];
    const activeUsers = users.filter(user => user.status === 'active');
    for (const user of activeUsers) {
      let currentDate = new Date(config.dateRange.start);
      while (currentDate <= config.dateRange.end) {
        if (Math.random() > 0.15) {
          const mealData = utils.generateMealData(
            user._id,
            new Date(currentDate)
          );
          meals.push(mealData);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    const createdMeals = await Meal.insertMany(meals);
    console.log(`✅ Created ${createdMeals.length} meal entries`);
    return createdMeals;
  } catch (error) {
    console.error('❌ Error creating meal entries:', error);
    throw error;
  }
};

// Create Bazar Entries
const createBazarEntries = async users => {
  try {
    console.log('🛒 Creating Bazar Entries...');
    const bazarEntries = [];
    const activeUsers = users.filter(user => user.status === 'active');
    for (const user of activeUsers) {
      let currentDate = new Date(config.dateRange.start);
      let entriesCreated = 0;
      while (
        currentDate <= config.dateRange.end &&
        entriesCreated < config.seedCounts.bazarEntriesPerUser
      ) {
        if (Math.random() > 0.7) {
          const bazarData = utils.generateBazarData(
            user._id,
            new Date(currentDate)
          );
          bazarEntries.push(bazarData);
          entriesCreated++;
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

// Create Statistics
const createStatistics = async (users, meals, bazarEntries) => {
  try {
    console.log('📊 Creating Statistics...');
    const stats = new Statistics({
      global: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        totalMeals: meals.length,
        totalBazarEntries: bazarEntries.length,
        totalRevenue: users.reduce((sum, u) => sum + u.totalPaid, 0),
        totalExpenses: bazarEntries.reduce((sum, b) => sum + b.totalAmount, 0),
        lastUpdated: new Date(),
      },
      meals: {
        totalBreakfast: meals.filter(m => m.breakfast).length,
        totalLunch: meals.filter(m => m.lunch).length,
        totalDinner: meals.filter(m => m.dinner).length,
        pendingMeals: meals.filter(m => m.status === 'pending').length,
        approvedMeals: meals.filter(m => m.status === 'approved').length,
        rejectedMeals: meals.filter(m => m.status === 'rejected').length,
        averageMealsPerDay: meals.length / 90,
        efficiency:
          meals.length > 0
            ? (meals.filter(m => m.status === 'approved').length /
                meals.length) *
              100
            : 0,
        lastUpdated: new Date(),
      },
      bazar: {
        totalAmount: bazarEntries.reduce((sum, b) => sum + b.totalAmount, 0),
        totalEntries: bazarEntries.length,
        pendingEntries: bazarEntries.filter(b => b.status === 'pending').length,
        approvedEntries: bazarEntries.filter(b => b.status === 'approved')
          .length,
        rejectedEntries: bazarEntries.filter(b => b.status === 'rejected')
          .length,
        averageAmount:
          bazarEntries.length > 0
            ? bazarEntries.reduce((sum, b) => sum + b.totalAmount, 0) /
              bazarEntries.length
            : 0,
        averageItemsPerEntry:
          bazarEntries.length > 0
            ? bazarEntries.reduce((sum, b) => sum + b.itemCount, 0) /
              bazarEntries.length
            : 0,
        lastUpdated: new Date(),
      },
      users: {
        adminUsers: users.filter(u => u.role === 'admin').length,
        memberUsers: users.filter(u => u.role === 'member').length,
        inactiveUsers: users.filter(u => u.status === 'inactive').length,
        newUsersThisMonth: users.filter(
          u =>
            u.joinDate >=
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ).length,
        activeUsersThisMonth: users.filter(
          u =>
            u.status === 'active' &&
            u.lastLogin >=
              new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ).length,
        lastUpdated: new Date(),
      },
      cache: {
        lastSyncTime: new Date(),
        isStale: false,
        version: 1,
      },
    });
    await stats.save();
    console.log('✅ Statistics created');
    return stats;
  } catch (error) {
    console.error('❌ Error creating statistics:', error);
    throw error;
  }
};

// Create UI Configuration
const createUIConfig = async superAdmin => {
  try {
    console.log('🎨 Creating UI Configuration...');
    const uiConfig = new UIConfig({
      appId: 'bachelor-mess-manager',
      version: '1.0.0',
      environment: 'development',
      isActive: true,
      theme: {
        primaryColor: '#667eea',
        secondaryColor: '#f3f4f6',
        accentColor: '#10b981',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 12,
        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      navigation: {
        tabs: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'home',
            route: '/dashboard',
            isVisible: true,
            isEnabled: true,
            order: 1,
            permissions: ['admin', 'member', 'super_admin'],
          },
          {
            id: 'meals',
            title: 'Meals',
            icon: 'restaurant',
            route: '/meals',
            isVisible: true,
            isEnabled: true,
            order: 2,
            permissions: ['admin', 'member', 'super_admin'],
          },
          {
            id: 'bazar',
            title: 'Bazar',
            icon: 'shopping-cart',
            route: '/bazar',
            isVisible: true,
            isEnabled: true,
            order: 3,
            permissions: ['admin', 'member', 'super_admin'],
          },
          {
            id: 'profile',
            title: 'Profile',
            icon: 'person',
            route: '/profile',
            isVisible: true,
            isEnabled: true,
            order: 4,
            permissions: ['admin', 'member', 'super_admin'],
          },
          {
            id: 'admin',
            title: 'Admin',
            icon: 'admin-panel-settings',
            route: '/admin',
            isVisible: true,
            isEnabled: true,
            order: 5,
            permissions: ['admin', 'super_admin'],
          },
        ],
        showTabBar: true,
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' },
      },
      features: {
        authentication: {
          enabled: true,
          allowRegistration: true,
          allowPasswordReset: true,
          requireEmailVerification: false,
        },
        mealManagement: {
          enabled: true,
          allowCreate: true,
          allowEdit: true,
          allowDelete: false,
          requireApproval: true,
        },
        bazarManagement: {
          enabled: true,
          allowCreate: true,
          allowEdit: true,
          allowDelete: false,
          requireApproval: true,
        },
        dashboard: {
          enabled: true,
          showAnalytics: true,
          showRecentActivity: true,
          showQuickActions: true,
        },
        notifications: {
          enabled: true,
          pushNotifications: false,
          emailNotifications: true,
          inAppNotifications: true,
        },
        realTimeUpdates: { enabled: false, pollingInterval: 30000 },
        backgroundSync: { enabled: false, syncInterval: 300000 },
        crashReporting: { enabled: false, collectUserData: false },
        analyticsTracking: {
          enabled: false,
          trackUserBehavior: false,
          trackPerformance: false,
        },
      },
      components: {
        header: {
          showLogo: true,
          logoUrl: '/assets/logo.png',
          showTitle: true,
          title: 'Bachelor Mess Manager',
          showUserMenu: true,
          showNotifications: true,
        },
        forms: {
          showValidationMessages: true,
          autoSave: false,
          showProgressIndicator: true,
        },
        lists: {
          itemsPerPage: 20,
          showPagination: true,
          showSearch: true,
          showFilters: true,
        },
        cards: { showShadows: true, showBorders: true, borderRadius: 12 },
      },
      content: {
        appName: 'Bachelor Mess Manager',
        appDescription: 'Manage your mess expenses and meals efficiently',
        welcomeMessage: 'Welcome to Bachelor Mess Manager',
        loadingMessage: 'Loading...',
        errorMessages: {
          networkError: 'Network error. Please check your connection.',
          serverError: 'Server error. Please try again later.',
          validationError: 'Please check your input and try again.',
          unauthorizedError: 'You are not authorized to perform this action.',
        },
        successMessages: {
          dataSaved: 'Data saved successfully.',
          dataDeleted: 'Data deleted successfully.',
          actionCompleted: 'Action completed successfully.',
        },
      },
      security: {
        requireAuthentication: true,
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 6,
          requireUppercase: false,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
      },
      performance: {
        cacheEnabled: true,
        cacheDuration: 300000,
        imageOptimization: true,
        lazyLoading: true,
        compression: true,
      },
      createdBy: superAdmin._id,
      lastModifiedBy: superAdmin._id,
    });
    await uiConfig.save();
    console.log('✅ UI Configuration created');
    return uiConfig;
  } catch (error) {
    console.error('❌ Error creating UI configuration:', error);
    throw error;
  }
};

// Generate summary
const generateSummary = async (users, meals, bazarEntries) => {
  const activeUsers = users.filter(u => u.status === 'active');
  const totalRevenue = users.reduce((sum, u) => sum + u.totalPaid, 0);
  const totalExpenses = bazarEntries.reduce((sum, b) => sum + b.totalAmount, 0);
  const approvedMeals = meals.filter(m => m.status === 'approved').length;
  const approvedBazar = bazarEntries.filter(
    b => b.status === 'approved'
  ).length;

  console.log('\n🎉 Perfect Seeding completed successfully!');
  console.log('\n📊 Data Summary:');
  console.log('   👥 Total Users: ' + users.length);
  console.log('   👤 Active Users: ' + activeUsers.length);
  console.log(
    '   👑 Super Admins: ' + users.filter(u => u.role === 'super_admin').length
  );
  console.log('   👨‍💼 Admins: ' + users.filter(u => u.role === 'admin').length);
  console.log(
    '   👥 Members: ' + users.filter(u => u.role === 'member').length
  );
  console.log('   🍽️  Total Meals: ' + meals.length);
  console.log('   ✅ Approved Meals: ' + approvedMeals);
  console.log('   🛒 Total Bazar Entries: ' + bazarEntries.length);
  console.log('   ✅ Approved Bazar: ' + approvedBazar);
  console.log('   💰 Total Revenue: ৳' + totalRevenue.toLocaleString());
  console.log('   💸 Total Expenses: ৳' + totalExpenses.toLocaleString());
  console.log(
    '   📈 Net Balance: ৳' + (totalRevenue - totalExpenses).toLocaleString()
  );

  console.log('\n🔑 Login Credentials:');
  console.log('   Super Admin: superadmin@bachelor-mess.com / SuperAdmin@2024');
  console.log('   Admin: admin@bachelor-mess.com / Admin@2024');
  console.log('   Assistant: assistant@bachelor-mess.com / Admin@2024');
  console.log('   Members: [random-email] / Member@2024');

  console.log('\n📋 Test Scenarios:');
  console.log('   • Login with different user roles');
  console.log('   • View dashboard with real data');
  console.log('   • Manage meals and bazar entries');
  console.log('   • Test approval workflows');
  console.log('   • View analytics and statistics');
  console.log('   • Test payment tracking');

  console.log(
    '\n✅ The application is now ready with comprehensive, realistic data!'
  );
};

// Main seeding function
const runPerfectSeeder = async () => {
  try {
    console.log('🚀 Starting Perfect Seeder...');
    console.log('📋 Configuration:');
    console.log(`   Database: ${config.mongoUri}`);
    console.log(`   Clear Existing: ${config.clearExisting}`);
    console.log(
      `   Date Range: ${config.dateRange.start.toDateString()} - ${config.dateRange.end.toDateString()}`
    );
    console.log(
      `   Users: ${config.seedCounts.superAdmins} Super Admin + ${config.seedCounts.admins} Admins + ${config.seedCounts.members} Members`
    );
    console.log(`   Meals per User: ${config.seedCounts.mealsPerUser}`);
    console.log(
      `   Bazar Entries per User: ${config.seedCounts.bazarEntriesPerUser}`
    );

    await connectDB();
    await clearDatabase();

    const superAdmin = await createSuperAdmin();
    const admins = await createAdminUsers();
    const members = await createMemberUsers();
    const allUsers = [superAdmin, ...admins, ...members];

    const meals = await createMealEntries(allUsers);
    const bazarEntries = await createBazarEntries(allUsers);

    await createStatistics(allUsers, meals, bazarEntries);
    await createUIConfig(superAdmin);

    await generateSummary(allUsers, meals, bazarEntries);
  } catch (error) {
    console.error('❌ Perfect Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

if (require.main === module) {
  runPerfectSeeder();
}

module.exports = { runPerfectSeeder };
