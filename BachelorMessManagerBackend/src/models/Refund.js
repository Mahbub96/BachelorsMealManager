const mongoose = require('mongoose');

/**
 * Refund: Admin sends money back to overpaid members.
 * Status: pending_refund -> sent -> acknowledged (completed).
 */
const refundSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: {
        values: ['pending_refund', 'sent', 'acknowledged'],
        message: 'Status must be pending_refund, sent, or acknowledged',
      },
      default: 'pending_refund',
      index: true,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_banking'],
      default: 'cash',
    },
    notes: { type: String, maxlength: 500, trim: true },
    sentAt: { type: Date },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
  },
  { timestamps: true }
);

refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
