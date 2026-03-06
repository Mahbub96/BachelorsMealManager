const mongoose = require('mongoose');

/**
 * Ledger: one entry per financial action for transparent group tracking.
 * refType + refId point to the source document (Bazar, Meal, PaymentRequest, Refund, etc.).
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      comment: 'Admin id of the group (createdBy for members)',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: [
          'meal_bazar',
          'flat_bazar',
          'meal_entry',
          'payment_request',
          'payment_recorded',
          'refund_sent',
          'refund_acknowledged',
        ],
        message: 'Invalid ledger type',
      },
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    refType: {
      type: String,
      enum: ['Bazar', 'Meal', 'PaymentRequest', 'Refund', 'User'],
      index: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, index: true },
    description: { type: String, maxlength: 500, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ groupId: 1, createdAt: -1 });
ledgerEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
