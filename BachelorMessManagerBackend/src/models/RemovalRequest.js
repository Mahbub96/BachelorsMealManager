const mongoose = require('mongoose');

const removalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['member_leave', 'admin_removal'],
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

removalRequestSchema.index({ userId: 1, status: 1 });
removalRequestSchema.index({ requestedBy: 1, status: 1 });

const RemovalRequest = mongoose.model('RemovalRequest', removalRequestSchema);
module.exports = RemovalRequest;
