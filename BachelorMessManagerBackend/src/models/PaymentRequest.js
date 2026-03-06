const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: { values: ['full_due', 'custom'], message: 'Type must be full_due or custom' },
      default: 'custom',
    },
    status: {
      type: String,
      enum: { values: ['pending', 'approved', 'rejected'], message: 'Invalid status' },
      default: 'pending',
      index: true,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_banking'],
      default: 'cash',
    },
    notes: { type: String, maxlength: 500, trim: true },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionNote: { type: String, maxlength: 500, trim: true },
  },
  { timestamps: true }
);

paymentRequestSchema.index({ userId: 1, status: 1 });
paymentRequestSchema.index({ status: 1, requestedAt: -1 });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
