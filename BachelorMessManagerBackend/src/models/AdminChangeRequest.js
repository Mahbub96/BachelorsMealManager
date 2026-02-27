const mongoose = require('mongoose');

const adminChangeRequestSchema = new mongoose.Schema(
  {
    groupAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    votes: [
      {
        voter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

adminChangeRequestSchema.index({ groupAdminId: 1, status: 1 });
adminChangeRequestSchema.index({ candidateId: 1, status: 1 });

const AdminChangeRequest = mongoose.model(
  'AdminChangeRequest',
  adminChangeRequestSchema
);

module.exports = AdminChangeRequest;

