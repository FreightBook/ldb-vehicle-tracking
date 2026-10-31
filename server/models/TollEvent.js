const mongoose = require('mongoose');

const TollEventSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    eventName: {
      type: String,
      default: 'TOLL PLAZA CROSSED',
    },
    locName: {
      type: String,
      required: true,
    },
    eventTime: {
      type: String,
      required: true,
    },
    eventTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
    seqNo: {
      type: String,
      default: null,
    },
    laneDirection: {
      type: String,
      default: null,
    },
    locLat: {
      type: Number,
      default: null,
    },
    locLong: {
      type: Number,
      default: null,
    },
    vehicleType: {
      type: String,
      default: null,
    },
    transportMode: {
      type: String,
      default: 'TRUCK',
    },
    containerNumber: {
      type: String,
      default: 'N/A',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate tolls within the same trip:
// 1. If seqNo is present, uniqueness on tripId + seqNo
TollEventSchema.index(
  { tripId: 1, seqNo: 1 },
  {
    unique: true,
    partialFilterExpression: { seqNo: { $type: 'string', $gt: '' } },
  }
);

// 2. Also ensure uniqueness on tripId + eventTime + locName
TollEventSchema.index({ tripId: 1, eventTime: 1, locName: 1 }, { unique: true });

module.exports = mongoose.model('TollEvent', TollEventSchema);

