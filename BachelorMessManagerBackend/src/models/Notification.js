const mongoose = require('mongoose');

/**
 * Notification — one document per recipient per event.
 * Controllers call notificationService.createNotification() after key actions.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'bazar_submitted',
        'bazar_approved',
        'bazar_rejected',
        'meal_submitted',
        'meal_approved',
        'meal_rejected',
        'payment_requested',
        'payment_approved',
        'payment_rejected',
        'refund_sent',
        'refund_acknowledged',
        'vote_started',
        'vote_cast',
        'election_started',
        'removal_requested',
        'removal_resolved',
      ],
      index: true,
    },
    title: { type: String, required: true, maxlength: 200, trim: true },
    message: { type: String, required: true, maxlength: 500, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    /** Optional: link back to source document */
    refType: {
      type: String,
      enum: ['Bazar', 'Meal', 'PaymentRequest', 'Refund', 'AdminChangeRequest', 'Election', 'RemovalRequest', 'User'],
    },
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
