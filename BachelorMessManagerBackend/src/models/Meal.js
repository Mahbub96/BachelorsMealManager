const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    breakfast: {
      type: Boolean,
      default: false,
    },
    lunch: {
      type: Boolean,
      default: false,
    },
    dinner: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true,
    },
    totalMeals: {
      type: Number,
      default: 0,
      min: [0, 'Total meals cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique meal entries per user per date
mealSchema.index({ userId: 1, date: 1 }, { unique: true });

// Indexes for better query performance
mealSchema.index({ status: 1, date: -1 });
mealSchema.index({ approvedBy: 1 });
mealSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total meals
mealSchema.pre('save', function (next) {
  this.totalMeals =
    (this.breakfast ? 1 : 0) + (this.lunch ? 1 : 0) + (this.dinner ? 1 : 0);
  next();
});

// Virtual for meal summary
mealSchema.virtual('mealSummary').get(function () {
  const meals = [];
  if (this.breakfast) meals.push('Breakfast');
  if (this.lunch) meals.push('Lunch');
  if (this.dinner) meals.push('Dinner');
  return meals.join(', ') || 'No meals';
});

// Virtual for approval info
mealSchema.virtual('approvalInfo').get(function () {
  if (this.status === 'pending') {
    return { status: 'pending', message: 'Awaiting approval' };
  }
  if (this.status === 'approved') {
    return {
      status: 'approved',
      message: 'Approved',
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy,
    };
  }
  if (this.status === 'rejected') {
    return {
      status: 'rejected',
      message: 'Rejected',
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy,
    };
  }
});

// Instance method to approve meal
mealSchema.methods.approve = function (adminId, notes = '') {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to reject meal
mealSchema.methods.reject = function (adminId, notes = '') {
  this.status = 'rejected';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to reset to pending
mealSchema.methods.resetToPending = function () {
  this.status = 'pending';
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

// Static method to find meals by user
mealSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId };

  if (options.startDate) query.date = { $gte: new Date(options.startDate) };
  if (options.endDate) {
    if (query.date) {
      query.date.$lte = new Date(options.endDate);
    } else {
      query.date = { $lte: new Date(options.endDate) };
    }
  }
  if (options.status) query.status = options.status;

  return this.find(query)
    .populate('userId', 'name email')
    .populate('approvedBy', 'name')
    .sort({ date: -1 })
    .limit(options.limit || 10);
};

// Static method to find all meals with filters
mealSchema.statics.findAllWithFilters = function (filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.userId) query.userId = filters.userId;
  if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (query.date) {
      query.date.$lte = new Date(filters.endDate);
    } else {
      query.date = { $lte: new Date(filters.endDate) };
    }
  }

  return this.find(query)
    .populate('userId', 'name email')
    .populate('approvedBy', 'name')
    .sort({ date: -1 });
};

// Static method to get meal statistics
mealSchema.statics.getStats = async function (filters = {}) {
  const matchStage = {};

  if (filters.startDate)
    matchStage.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (matchStage.date) {
      matchStage.date.$lte = new Date(filters.endDate);
    } else {
      matchStage.date = { $lte: new Date(filters.endDate) };
    }
  }
  if (filters.userId)
    matchStage.userId = new mongoose.Types.ObjectId(filters.userId);

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBreakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
        totalLunch: { $sum: { $cond: ['$lunch', 1, 0] } },
        totalDinner: { $sum: { $cond: ['$dinner', 1, 0] } },
        totalMeals: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
        },
        totalEntries: { $sum: 1 },
      },
    },
  ]);

  return (
    stats[0] || {
      totalBreakfast: 0,
      totalLunch: 0,
      totalDinner: 0,
      totalMeals: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      totalEntries: 0,
    }
  );
};

// Static method to get meal distribution by date
mealSchema.statics.getMealDistribution = async function (filters = {}) {
  const matchStage = {};

  if (filters.startDate)
    matchStage.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (matchStage.date) {
      matchStage.date.$lte = new Date(filters.endDate);
    } else {
      matchStage.date = { $lte: new Date(filters.endDate) };
    }
  }
  if (filters.userId)
    matchStage.userId = new mongoose.Types.ObjectId(filters.userId);

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
        lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
        dinner: { $sum: { $cond: ['$dinner', 1, 0] } },
        total: { $sum: '$totalMeals' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to check if meal exists for user and date
mealSchema.statics.existsForUserAndDate = function (userId, date) {
  return this.findOne({ userId, date });
};

module.exports = mongoose.model('Meal', mealSchema);
