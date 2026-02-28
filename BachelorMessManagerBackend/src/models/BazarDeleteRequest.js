const mongoose = require('mongoose');

const bazarDeleteRequestSchema = new mongoose.Schema(
  {
    bazarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bazar',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedFor: {
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
    bazarDate: { type: Date, required: true },
    bazarSummary: { type: String, default: '' },
    totalAmount: { type: Number, default: 0 },
    respondedAt: { type: Date },
    responseNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

bazarDeleteRequestSchema.index({ requestedFor: 1, status: 1 });
bazarDeleteRequestSchema.index({ bazarId: 1, status: 1 });

module.exports = mongoose.model('BazarDeleteRequest', bazarDeleteRequestSchema);
