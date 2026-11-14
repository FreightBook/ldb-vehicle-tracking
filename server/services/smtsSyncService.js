const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const { resolveLocation } = require('./locationService');
const { pollTripData } = require('./trackingScheduler');

let smtsConnection = null;

/**
 * Returns cached Mongoose connection to SMTS database
 */
async function getSmtsConnection() {
  const uri = process.env.SMTS_MONGO_URI;
  if (!uri) {
    throw new Error('SMTS_MONGO_URI environment variable is not defined');
  }

  if (smtsConnection && smtsConnection.readyState === 1) {
    return smtsConnection;
  }

  smtsConnection = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 8000,
  }).asPromise();

  console.log('[SMTS Sync] Connected to SMTS MongoDB database successfully');
  return smtsConnection;
}

/**
 * Great-circle distance between two GPS coordinates using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate road distance (1.25x winding factor) and duration in days (150 km/day).
 */
function estimateRoadDistanceAndDays(originCoords, destCoords) {
  if (
    !originCoords ||
    !destCoords ||
    typeof originCoords.lat !== 'number' ||
    typeof destCoords.lat !== 'number'
  ) {
    return { roadKm: null, days: 7 }; // default 7 days fallback
  }

  const straightKm = calculateDistanceKm(
    originCoords.lat,
    originCoords.lng,
    destCoords.lat,
    destCoords.lng
  );
  const roadKm = Math.max(20, Math.round(straightKm * 1.25));
  const days = Math.max(2, Math.min(30, Math.ceil(roadKm / 150)));

  return { roadKm, days };
}

/**
 * Normalizes vehicle registration number
 */
function cleanVehicleNumber(val) {
  return (val || '').toUpperCase().replace(/[\s-]/g, '').trim();
}

/**
 * Convert Date to YYYY-MM-DD
 */
function toDateString(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Process a single loading slip into an active LDB Trip
 */
async function processSlipToTrip(slip) {
  const StoppedTracking = require('../models/StoppedTracking');

  const rawTempo = slip.tempoNumber || slip.vehicleNumber;
  if (!rawTempo) return null;

  const cleaned = cleanVehicleNumber(rawTempo);
  if (cleaned.length < 5) return null;

  const slipNum = typeof slip.slipNumber === 'number' ? slip.slipNumber : null;

  // 1. Check if this specific loading slip has ALREADY been tracked in ANY trip (ACTIVE, SCHEDULED, or COMPLETED)
  if (slipNum) {
    const existingTripWithSlip = await Trip.findOne({ sourceSlipNumber: slipNum });
    if (existingTripWithSlip) {
      console.log(
        `[SMTS Sync] Loading Slip #${slipNum} (${cleaned}) was already tracked in trip ${existingTripWithSlip._id} (status: ${existingTripWithSlip.status}). Skipping.`
      );
      return { status: 'EXISTS', trip: existingTripWithSlip, slipNumber: slipNum };
    }
  }

  // 2. Check if this vehicle is currently ACTIVE or SCHEDULED
  const existingActive = await Trip.findOne({
    vehicleNumber: cleaned,
    status: { $in: ['ACTIVE', 'SCHEDULED'] },
  });

  if (existingActive) {
    return { status: 'EXISTS', trip: existingActive, slipNumber: slipNum };
  }

  // 3. Check if this loading slip was previously stopped or deleted by user
  if (slipNum) {
    const stoppedSlip = await StoppedTracking.findOne({ slipNumber: slipNum });
    if (stoppedSlip) {
      console.log(
        `[SMTS Sync] Loading Slip #${slipNum} (${cleaned}) was previously ${stoppedSlip.action} by user on ${stoppedSlip.stoppedAt}. Skipping.`
      );
      return { status: 'STOPPED_BY_USER', slipNumber: slipNum };
    }
  }

  // 4. Check if tracking for this vehicle was stopped or completed recently
  const slipDate = slip.date ? new Date(slip.date) : (slip.createdAt ? new Date(slip.createdAt) : null);

  const recentStop = await StoppedTracking.findOne({ vehicleNumber: cleaned }).sort({ stoppedAt: -1 });
  if (recentStop) {
    // If slip date is older than or concurrent with the user stop action, do not resurrect!
    if (!slipDate || slipDate <= recentStop.stoppedAt) {
      console.log(
        `[SMTS Sync] Vehicle ${cleaned} was stopped by user on ${recentStop.stoppedAt.toISOString()}. Slip #${slipNum || 'N/A'} date is ${slipDate ? slipDate.toISOString() : 'older'}. Skipping.`
      );
      return { status: 'STOPPED_BY_USER', slipNumber: slipNum };
    }
  }

  // Check any COMPLETED trip for this vehicle
  const recentCompleted = await Trip.findOne({
    vehicleNumber: cleaned,
    status: 'COMPLETED',
  }).sort({ endedAt: -1 });

  if (recentCompleted && recentCompleted.endedAt) {
    if (!slipDate || slipDate <= recentCompleted.endedAt) {
      console.log(
        `[SMTS Sync] Vehicle ${cleaned} has a COMPLETED trip ended at ${recentCompleted.endedAt.toISOString()}. Slip #${slipNum || 'N/A'} is not newer. Skipping.`
      );
      return { status: 'STOPPED_BY_USER', slipNumber: slipNum };
    }
  }

  const originText = (slip.loadingLocation || '').trim();
  const destText = (slip.deliveryLocation || '').trim();

  const oRes = originText ? resolveLocation(originText) : null;
  const dRes = destText ? resolveLocation(destText) : null;

  const originCoords = oRes ? { lat: oRes.lat, lng: oRes.lng } : null;
  const destinationCoords = dRes ? { lat: dRes.lat, lng: dRes.lng } : null;

  const { roadKm, days } = estimateRoadDistanceAndDays(originCoords, destinationCoords);

  // Determine start date and end date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = slip.date ? new Date(slip.date) : new Date();
  startDate.setHours(0, 0, 0, 0);

  // If slip date was in the past, anchor start date to today so active window is valid
  if (startDate < today) {
    startDate = new Date(today);
  }

  const endDate = addDays(startDate, days);
  endDate.setHours(23, 59, 50, 0);

  const newTrip = await Trip.create({
    vehicleNumber: cleaned,
    startDate,
    endDate,
    origin: originText,
    destination: destText,
    originCoords: originCoords || undefined,
    destinationCoords: destinationCoords || undefined,
    estimatedDistanceKm: roadKm || null,
    suggestedDurationDays: days || null,
    status: 'ACTIVE',
    source: 'SMTS_SLIP',
    sourceSlipNumber: slipNum,
    startedAt: new Date(),
    totalTolls: 0,
  });

  console.log(
    `[SMTS Auto-Sync] Auto-registered vehicle ${cleaned} from Loading Slip #${slipNum || 'N/A'} (${originText} ➔ ${destText}, ~${roadKm || 'N/A'} km, ${days} days)`
  );

  // Trigger immediate initial LDB poll in background
  pollTripData(newTrip).catch((err) => {
    console.error(`[SMTS Initial Poll Error] ${cleaned}: ${err.message}`);
  });

  return { status: 'CREATED', trip: newTrip, slipNumber: slipNum };
}

/**
 * Synchronize recent loading slips from SMTS database into LDB tracking
 * @param {Object} options { limit, daysBack }
 */
async function syncSlipsFromSMTS(options = {}) {
  const limit = options.limit || 30;
  const daysBack = options.daysBack || 5;

  try {
    const conn = await getSmtsConnection();
    const LoadingSlip = conn.model(
      'LoadingSlip',
      new mongoose.Schema({}, { strict: false }),
      'loading_slip_data'
    );

    const sinceDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    sinceDate.setHours(0, 0, 0, 0);

    const query = {
      $or: [
        { date: { $gte: sinceDate } },
        { createdAt: { $gte: sinceDate } },
      ],
    };

    // Fetch recent slips
    let slips = await LoadingSlip.find(query).sort({ date: -1, slipNumber: -1 }).limit(limit).lean();

    // Fallback: if query by date returned 0, get the latest N slips regardless of date
    if (slips.length === 0) {
      slips = await LoadingSlip.find({}).sort({ date: -1, slipNumber: -1 }).limit(10).lean();
    }

    const createdTrips = [];
    let skippedCount = 0;

    for (const slip of slips) {
      const res = await processSlipToTrip(slip);
      if (res) {
        if (res.status === 'CREATED') {
          createdTrips.push(res.trip);
        } else if (res.status === 'EXISTS' || res.status === 'STOPPED_BY_USER') {
          skippedCount++;
        }
      }
    }

    return {
      success: true,
      totalChecked: slips.length,
      syncedCount: createdTrips.length,
      skippedCount,
      newTrips: createdTrips,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[SMTS Sync Error] Failed to sync slips: ${err.message}`);
    throw err;
  }
}

module.exports = {
  syncSlipsFromSMTS,
  processSlipToTrip,
  getSmtsConnection,
};

