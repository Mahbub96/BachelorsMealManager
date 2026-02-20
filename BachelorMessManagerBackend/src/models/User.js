const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'],
    },
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'admin', 'member'],
        message: 'Role must be either super_admin, admin, or member',
      },
      default: 'member',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either active or inactive',
      },
      default: 'active',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    lastLogoutAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Payment-related fields
    monthlyContribution: {
      type: Number,
      default: 5000,
      min: [0, 'Monthly contribution cannot be negative'],
    },
    lastPaymentDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['paid', 'pending', 'overdue'],
        message: 'Payment status must be paid, pending, or overdue',
      },
      default: 'pending',
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative'],
    },
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        method: {
          type: String,
          enum: ['cash', 'bank_transfer', 'mobile_banking'],
          default: 'cash',
        },
        status: {
          type: String,
          enum: ['completed', 'pending', 'failed'],
          default: 'completed',
        },
        notes: String,
      },
    ],
    // Super Admin specific fields
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    superAdminPermissions: {
      type: [String],
      enum: [
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
      default: [],
    },
    lastSuperAdminAction: {
      type: Date,
    },
    superAdminNotes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Track which admin created this user
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual('fullProfile').get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    joinDate: this.joinDate,
    lastLogin: this.lastLogin,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    this.password = await bcrypt.hash(this.password, salt);

    // Set passwordChangedAt
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    }
  );
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ status: 'active' });
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, status: 'active' });
};

// Static method to get user statistics
userSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] },
        },
        memberUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'member'] }, 1, 0] },
        },
        superAdminUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'super_admin'] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      memberUsers: 0,
      superAdminUsers: 0,
    }
  );
};

// Static method to find super admins
userSchema.statics.findSuperAdmins = function () {
  return this.find({
    $or: [{ role: 'super_admin' }, { isSuperAdmin: true }],
    status: 'active',
  });
};

// Static method to get super admin statistics
userSchema.statics.getSuperAdminStats = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [{ role: 'super_admin' }, { isSuperAdmin: true }],
      },
    },
    {
      $group: {
        _id: null,
        totalSuperAdmins: { $sum: 1 },
        activeSuperAdmins: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        avgPermissions: { $avg: { $size: '$superAdminPermissions' } },
        lastActionDate: { $max: '$lastSuperAdminAction' },
      },
    },
  ]);

  return (
    stats[0] || {
      totalSuperAdmins: 0,
      activeSuperAdmins: 0,
      avgPermissions: 0,
      lastActionDate: null,
    }
  );
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Instance method to deactivate user
userSchema.methods.deactivate = function () {
  this.status = 'inactive';
  return this.save();
};

// Instance method to activate user
userSchema.methods.activate = function () {
  this.status = 'active';
  return this.save();
};

// Instance method to change role
userSchema.methods.changeRole = function (newRole) {
  if (!['super_admin', 'admin', 'member'].includes(newRole)) {
    throw new Error('Invalid role');
  }
  this.role = newRole;
  return this.save();
};

// Instance method to check if user is super admin
userSchema.methods.isSuperAdminUser = function () {
  return this.role === 'super_admin' || this.isSuperAdmin === true;
};

// Instance method to check super admin permissions
userSchema.methods.hasSuperAdminPermission = function (permission) {
  if (!this.isSuperAdminUser()) {
    return false;
  }
  return this.superAdminPermissions.includes(permission);
};

// Instance method to add super admin permission
userSchema.methods.addSuperAdminPermission = function (permission) {
  if (!this.superAdminPermissions.includes(permission)) {
    this.superAdminPermissions.push(permission);
  }
  return this.save();
};

// Instance method to remove super admin permission
userSchema.methods.removeSuperAdminPermission = function (permission) {
  this.superAdminPermissions = this.superAdminPermissions.filter(
    p => p !== permission
  );
  return this.save();
};

// Instance method to update super admin action
userSchema.methods.updateSuperAdminAction = function (action) {
  this.lastSuperAdminAction = new Date();
  this.superAdminNotes = action;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
