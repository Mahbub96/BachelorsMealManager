const mongoose = require('mongoose');

const bazarItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [1, 'Item name must be at least 1 character long'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
      minlength: [1, 'Quantity must be at least 1 character long'],
      maxlength: [50, 'Quantity cannot exceed 50 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const bazarSchema = new mongoose.Schema(
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
    items: {
      type: [bazarItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    receiptImage: {
      type: String,
      trim: true,
    },
    /** meal = groceries/food (used for meal rate); flat = shared equipment/utilities (split equally) */
    type: {
      type: String,
      enum: {
        values: ['meal', 'flat'],
        message: 'Type must be meal or flat',
      },
      default: 'meal',
      index: true,
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
    itemCount: {
      type: Number,
      default: 0,
      min: [0, 'Item count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
bazarSchema.index({ status: 1, date: -1 });
bazarSchema.index({ userId: 1, date: -1 });
bazarSchema.index({ approvedBy: 1 });
bazarSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate item count and validate total amount
bazarSchema.pre('save', function (next) {
  // Calculate item count
  this.itemCount = this.items.length;

  // Calculate total amount from items
  const calculatedTotal = this.items.reduce((sum, item) => sum + item.price, 0);

  // Validate that total amount matches calculated total
  if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
    return next(new Error('Total amount does not match sum of item prices'));
  }

  next();
});

// Virtual for bazar summary
bazarSchema.virtual('bazarSummary').get(function () {
  return {
    itemCount: this.itemCount,
    totalAmount: this.totalAmount,
    status: this.status,
    date: this.date,
  };
});

// Virtual for approval info
bazarSchema.virtual('approvalInfo').get(function () {
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

// Virtual for items summary
bazarSchema.virtual('itemsSummary').get(function () {
  return this.items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));
});

// Instance method to approve bazar entry
bazarSchema.methods.approve = function (adminId, notes = '') {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to reject bazar entry
bazarSchema.methods.reject = function (adminId, notes = '') {
  this.status = 'rejected';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to reset to pending
bazarSchema.methods.resetToPending = function () {
  this.status = 'pending';
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

// Instance method to update receipt image
bazarSchema.methods.updateReceiptImage = function (imageUrl) {
  this.receiptImage = imageUrl;
  return this.save();
};

// Static method to find bazar entries by user
bazarSchema.statics.findByUser = function (userId, options = {}) {
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

// Static method to find all bazar entries with filters
bazarSchema.statics.findAllWithFilters = function (filters = {}) {
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

// Static method to get bazar statistics
bazarSchema.statics.getStats = async function (filters = {}) {
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
        totalAmount: { $sum: '$totalAmount' },
        totalEntries: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
        },
        averageAmount: { $avg: '$totalAmount' },
        maxAmount: { $max: '$totalAmount' },
        minAmount: { $min: '$totalAmount' },
      },
    },
  ]);

  return (
    stats[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0,
    }
  );
};

// Static method to get expense trend
bazarSchema.statics.getExpenseTrend = async function (filters = {}) {
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
        totalAmount: { $sum: '$totalAmount' },
        entryCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to get category breakdown
bazarSchema.statics.getCategoryBreakdown = async function (filters = {}) {
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
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalAmount: { $sum: '$items.price' },
        totalQuantity: { $sum: 1 },
        averagePrice: { $avg: '$items.price' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

// Static method to check if bazar entry exists for user and date
bazarSchema.statics.existsForUserAndDate = function (userId, date) {
  return this.findOne({ userId, date });
};

// Static method to get user statistics
bazarSchema.statics.getUserStats = async function (userId, filters = {}) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (filters.startDate)
    matchStage.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (matchStage.date) {
      matchStage.date.$lte = new Date(filters.endDate);
    } else {
      matchStage.date = { $lte: new Date(filters.endDate) };
    }
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        totalEntries: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
        },
        averageAmount: { $avg: '$totalAmount' },
        maxAmount: { $max: '$totalAmount' },
        minAmount: { $min: '$totalAmount' },
      },
    },
  ]);

  return (
    stats[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0,
    }
  );
};

// Static method to get summary by category
bazarSchema.statics.getSummaryByCategory = async function (filters = {}) {
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

  return await this.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalAmount: { $sum: '$items.price' },
        totalQuantity: { $sum: 1 },
        averagePrice: { $avg: '$items.price' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

// Static method to get trends
bazarSchema.statics.getTrends = async function (period = 'month') {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return await this.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        totalAmount: { $sum: '$totalAmount' },
        entryCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = mongoose.model('Bazar', bazarSchema);
