const mongoose = require('mongoose');

const mealDeleteRequestSchema = new mongoose.Schema(
  {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
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
    mealDate: { type: Date, required: true },
    mealSummary: { type: String, default: '' },
    respondedAt: { type: Date },
    responseNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

mealDeleteRequestSchema.index({ requestedFor: 1, status: 1 });
mealDeleteRequestSchema.index({ mealId: 1, status: 1 });

module.exports = mongoose.model('MealDeleteRequest', mealDeleteRequestSchema);
