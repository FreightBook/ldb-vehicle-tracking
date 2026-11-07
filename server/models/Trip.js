const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    origin: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    destination: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    originCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    destinationCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    estimatedDistanceKm: {
      type: Number,
      default: null,
    },
    suggestedDurationDays: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SCHEDULED', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    source: {
      type: String,
      enum: ['MANUAL', 'SMTS_SLIP'],
      default: 'MANUAL',
      index: true,
    },
    sourceSlipNumber: {
      type: Number,
      default: null,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
      // TTL index: MongoDB will automatically delete documents 30 days (2,592,000 seconds) after endedAt
      index: {
        expireAfterSeconds: 30 * 24 * 60 * 60,
        partialFilterExpression: { endedAt: { $type: 'date' } },
      },
    },
    latestToll: {
      eventName: { type: String, default: null },
      locName: { type: String, default: null },
      eventTime: { type: String, default: null },
      locLat: { type: Number, default: null },
      locLong: { type: Number, default: null },
      deductedAt: { type: Date, default: null },
    },
    totalTolls: {
      type: Number,
      default: 0,
    },
    lastPolledAt: {
      type: Date,
      default: null,
    },
    lastPollStatus: {
      type: String,
      default: null,
    },
    lastPollMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch trips by status and date
TripSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Trip', TripSchema);

