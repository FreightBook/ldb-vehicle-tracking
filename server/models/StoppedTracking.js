const mongoose = require('mongoose');

const StoppedTrackingSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    slipNumber: {
      type: Number,
      index: true,
      default: null,
    },
    action: {
      type: String,
      enum: ['STOPPED', 'DELETED', 'COMPLETED'],
      default: 'STOPPED',
    },
    stoppedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      default: 'User stopped or deleted tracking',
    },
  },
  {
    timestamps: true,
  }
);

StoppedTrackingSchema.index({ vehicleNumber: 1, stoppedAt: -1 });

module.exports = mongoose.model('StoppedTracking', StoppedTrackingSchema);
