const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema(
  {
    // Global Statistics
    global: {
      totalUsers: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
      totalMeals: { type: Number, default: 0 },
      totalBazarEntries: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Meal Statistics
    meals: {
      totalBreakfast: { type: Number, default: 0 },
      totalLunch: { type: Number, default: 0 },
      totalDinner: { type: Number, default: 0 },
      pendingMeals: { type: Number, default: 0 },
      approvedMeals: { type: Number, default: 0 },
      rejectedMeals: { type: Number, default: 0 },
      averageMealsPerDay: { type: Number, default: 0 },
      efficiency: { type: Number, default: 0 }, // Percentage of approved meals
      lastUpdated: { type: Date, default: Date.now },
    },

    // Bazar Statistics
    bazar: {
      totalAmount: { type: Number, default: 0 },
      totalEntries: { type: Number, default: 0 },
      pendingEntries: { type: Number, default: 0 },
      approvedEntries: { type: Number, default: 0 },
      rejectedEntries: { type: Number, default: 0 },
      averageAmount: { type: Number, default: 0 },
      averageItemsPerEntry: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // User Statistics
    users: {
      adminUsers: { type: Number, default: 0 },
      memberUsers: { type: Number, default: 0 },
      inactiveUsers: { type: Number, default: 0 },
      newUsersThisMonth: { type: Number, default: 0 },
      activeUsersThisMonth: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Monthly Statistics (for charts and trends)
    monthly: {
      currentMonth: {
        meals: {
          total: { type: Number, default: 0 },
          breakfast: { type: Number, default: 0 },
          lunch: { type: Number, default: 0 },
          dinner: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          approved: { type: Number, default: 0 },
          rejected: { type: Number, default: 0 },
        },
        bazar: {
          totalAmount: { type: Number, default: 0 },
          totalEntries: { type: Number, default: 0 },
          averageAmount: { type: Number, default: 0 },
          pendingEntries: { type: Number, default: 0 },
          approvedEntries: { type: Number, default: 0 },
          rejectedEntries: { type: Number, default: 0 },
        },
        users: {
          newUsers: { type: Number, default: 0 },
          activeUsers: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date, default: Date.now },
      },
      previousMonth: {
        meals: {
          total: { type: Number, default: 0 },
          breakfast: { type: Number, default: 0 },
          lunch: { type: Number, default: 0 },
          dinner: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          approved: { type: Number, default: 0 },
          rejected: { type: Number, default: 0 },
        },
        bazar: {
          totalAmount: { type: Number, default: 0 },
          totalEntries: { type: Number, default: 0 },
          averageAmount: { type: Number, default: 0 },
          pendingEntries: { type: Number, default: 0 },
          approvedEntries: { type: Number, default: 0 },
          rejectedEntries: { type: Number, default: 0 },
        },
        users: {
          newUsers: { type: Number, default: 0 },
          activeUsers: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date, default: Date.now },
      },
    },

    // Weekly Statistics
    weekly: {
      currentWeek: {
        meals: {
          total: { type: Number, default: 0 },
          breakfast: { type: Number, default: 0 },
          lunch: { type: Number, default: 0 },
          dinner: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          approved: { type: Number, default: 0 },
          rejected: { type: Number, default: 0 },
        },
        bazar: {
          totalAmount: { type: Number, default: 0 },
          totalEntries: { type: Number, default: 0 },
          averageAmount: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date, default: Date.now },
      },
    },

    // Daily Statistics
    daily: {
      today: {
        meals: {
          total: { type: Number, default: 0 },
          breakfast: { type: Number, default: 0 },
          lunch: { type: Number, default: 0 },
          dinner: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          approved: { type: Number, default: 0 },
          rejected: { type: Number, default: 0 },
        },
        bazar: {
          totalAmount: { type: Number, default: 0 },
          totalEntries: { type: Number, default: 0 },
          averageAmount: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date, default: Date.now },
      },
    },

    // Performance Metrics
    performance: {
      averageResponseTime: { type: Number, default: 0 },
      totalRequests: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Cache for quick access
    cache: {
      lastSyncTime: { type: Date, default: Date.now },
      isStale: { type: Boolean, default: false },
      version: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
statisticsSchema.index({ 'cache.lastSyncTime': -1 });
statisticsSchema.index({ 'global.lastUpdated': -1 });

// Static method to get or create statistics document
statisticsSchema.statics.getOrCreate = async function () {
  let stats = await this.findOne();
  if (!stats) {
    stats = new this();
    await stats.save();
  }
  return stats;
};

// Static method to update all statistics
statisticsSchema.statics.updateAllStatistics = async function () {
  const User = mongoose.model('User');
  const Meal = mongoose.model('Meal');
  const Bazar = mongoose.model('Bazar');

  const stats = await this.getOrCreate();

  try {
    // Update global statistics
    const globalStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
    ]);

    const mealStats = await Meal.aggregate([
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
          totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
          totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
          pendingMeals: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedMeals: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejectedMeals: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    const bazarStats = await Bazar.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          pendingEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejectedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    // Update global stats
    const globalData = globalStats[0] || { totalUsers: 0, activeUsers: 0 };
    const mealData = mealStats[0] || {
      totalMeals: 0,
      totalBreakfast: 0,
      totalLunch: 0,
      totalDinner: 0,
      pendingMeals: 0,
      approvedMeals: 0,
      rejectedMeals: 0,
    };
    const bazarData = bazarStats[0] || {
      totalEntries: 0,
      totalAmount: 0,
      pendingEntries: 0,
      approvedEntries: 0,
      rejectedEntries: 0,
    };

    // Update global statistics
    stats.global = {
      totalUsers: globalData.totalUsers,
      activeUsers: globalData.activeUsers,
      totalMeals: mealData.totalMeals,
      totalBazarEntries: bazarData.totalEntries,
      totalRevenue: 0, // Calculate based on your business logic
      totalExpenses: bazarData.totalAmount,
      lastUpdated: new Date(),
    };

    // Update meal statistics
    stats.meals = {
      totalBreakfast: mealData.totalBreakfast,
      totalLunch: mealData.totalLunch,
      totalDinner: mealData.totalDinner,
      pendingMeals: mealData.pendingMeals,
      approvedMeals: mealData.approvedMeals,
      rejectedMeals: mealData.rejectedMeals,
      averageMealsPerDay:
        mealData.totalMeals > 0 ? mealData.totalMeals / 30 : 0,
      efficiency:
        mealData.totalMeals > 0
          ? (mealData.approvedMeals / mealData.totalMeals) * 100
          : 0,
      lastUpdated: new Date(),
    };

    // Update bazar statistics
    stats.bazar = {
      totalAmount: bazarData.totalAmount,
      totalEntries: bazarData.totalEntries,
      pendingEntries: bazarData.pendingEntries,
      approvedEntries: bazarData.approvedEntries,
      rejectedEntries: bazarData.rejectedEntries,
      averageAmount:
        bazarData.totalEntries > 0
          ? bazarData.totalAmount / bazarData.totalEntries
          : 0,
      averageItemsPerEntry: 0, // Calculate based on your items structure
      lastUpdated: new Date(),
    };

    // Update cache
    stats.cache = {
      lastSyncTime: new Date(),
      isStale: false,
      version: stats.cache.version + 1,
    };

    await stats.save();
    return stats;
  } catch (error) {
    console.error('Error updating statistics:', error);
    throw error;
  }
};

// Static method to update monthly statistics
statisticsSchema.statics.updateMonthlyStatistics = async function () {
  const Meal = mongoose.model('Meal');
  const Bazar = mongoose.model('Bazar');
  const User = mongoose.model('User');

  const stats = await this.getOrCreate();
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Current month statistics
    const currentMonthMeals = await Meal.aggregate([
      {
        $match: {
          date: { $gte: currentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
          lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
          dinner: { $sum: { $cond: ['$dinner', 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    const currentMonthBazar = await Bazar.aggregate([
      {
        $match: {
          date: { $gte: currentMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalEntries: { $sum: 1 },
          pendingEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejectedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    const currentMonthUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth },
        },
      },
      {
        $group: {
          _id: null,
          newUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
    ]);

    // Update current month statistics
    const mealData = currentMonthMeals[0] || {
      total: 0,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    const bazarData = currentMonthBazar[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingEntries: 0,
      approvedEntries: 0,
      rejectedEntries: 0,
    };

    const userData = currentMonthUsers[0] || {
      newUsers: 0,
      activeUsers: 0,
    };

    stats.monthly.currentMonth = {
      meals: {
        total: mealData.total,
        breakfast: mealData.breakfast,
        lunch: mealData.lunch,
        dinner: mealData.dinner,
        pending: mealData.pending,
        approved: mealData.approved,
        rejected: mealData.rejected,
      },
      bazar: {
        totalAmount: bazarData.totalAmount,
        totalEntries: bazarData.totalEntries,
        averageAmount:
          bazarData.totalEntries > 0
            ? bazarData.totalAmount / bazarData.totalEntries
            : 0,
        pendingEntries: bazarData.pendingEntries,
        approvedEntries: bazarData.approvedEntries,
        rejectedEntries: bazarData.rejectedEntries,
      },
      users: {
        newUsers: userData.newUsers,
        activeUsers: userData.activeUsers,
      },
      lastUpdated: new Date(),
    };

    await stats.save();
    return stats;
  } catch (error) {
    console.error('Error updating monthly statistics:', error);
    throw error;
  }
};

// Instance method to mark cache as stale
statisticsSchema.methods.markStale = function () {
  this.cache.isStale = true;
  return this.save();
};

// Instance method to get formatted statistics
statisticsSchema.methods.getFormattedStats = function () {
  return {
    global: this.global,
    meals: this.meals,
    bazar: this.bazar,
    users: this.users,
    monthly: this.monthly,
    weekly: this.weekly,
    daily: this.daily,
    performance: this.performance,
    lastUpdated: this.cache.lastSyncTime,
    isStale: this.cache.isStale,
  };
};

module.exports = mongoose.model('Statistics', statisticsSchema);
