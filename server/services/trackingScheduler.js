const cron = require('node-cron');
const Trip = require('../models/Trip');
const TollEvent = require('../models/TollEvent');
const { fetchLdbTruckEvents } = require('./ldbService');

let isSchedulerRunning = false;

/**
 * Poll and sync toll data for a single active trip
 * @param {Trip} trip
 * @returns {Promise<{ newEventsCount: number, error?: string }>}
 */
async function pollTripData(trip) {
  try {
    const now = new Date();

    // Check if trip has reached its end date (23:59:50)
    if (now >= trip.endDate) {
      trip.status = 'COMPLETED';
      trip.endedAt = now;
      await trip.save();
      console.log(
        `[Scheduler] Auto-completed trip for vehicle ${trip.vehicleNumber} (End date reached: ${trip.endDate.toISOString()})`
      );
      return { newEventsCount: 0 };
    }

    const result = await fetchLdbTruckEvents(trip.vehicleNumber);

    if (!result.success) {
      trip.lastPolledAt = now;
      trip.lastPollStatus = 'ERROR';
      trip.lastPollMessage = result.rawMessage;
      await trip.save();
      return { newEventsCount: 0, error: result.rawMessage };
    }

    let newEventsCount = 0;

    for (const ev of result.events) {
      // Filter out events that occurred outside the trip window
      if (ev.eventTimestamp < trip.startDate || ev.eventTimestamp > trip.endDate) {
        continue;
      }

      // Check if event already exists in MongoDB
      const query = { tripId: trip._id };
      if (ev.seqNo) {
        query.$or = [
          { seqNo: ev.seqNo },
          { eventTime: ev.eventTime, locName: ev.locName },
        ];
      } else {
        query.eventTime = ev.eventTime;
        query.locName = ev.locName;
      }

      const existing = await TollEvent.findOne(query).select('_id').lean();

      if (!existing) {
        try {
          await TollEvent.create({
            tripId: trip._id,
            vehicleNumber: trip.vehicleNumber,
            eventName: ev.eventName,
            locName: ev.locName,
            eventTime: ev.eventTime,
            eventTimestamp: ev.eventTimestamp,
            seqNo: ev.seqNo,
            laneDirection: ev.laneDirection,
            locLat: ev.locLat,
            locLong: ev.locLong,
            vehicleType: ev.vehicleType,
            transportMode: ev.transportMode,
            containerNumber: ev.containerNumber,
          });
          newEventsCount++;
        } catch (insertErr) {
          // Ignore duplicate key errors if race condition occurred
          if (insertErr.code !== 11000) {
            console.error(`[Scheduler] Insert error: ${insertErr.message}`);
          }
        }
      }
    }

    // Refresh trip aggregate statistics
    const totalCount = await TollEvent.countDocuments({ tripId: trip._id });
    const latestEvent = await TollEvent.findOne({ tripId: trip._id })
      .sort({ eventTimestamp: -1 })
      .lean();

    trip.totalTolls = totalCount;
    if (latestEvent) {
      trip.latestToll = {
        eventName: latestEvent.eventName,
        locName: latestEvent.locName,
        eventTime: latestEvent.eventTime,
        locLat: latestEvent.locLat,
        locLong: latestEvent.locLong,
        deductedAt: latestEvent.eventTimestamp,
      };
    }

    trip.lastPolledAt = now;
    trip.lastPollStatus = result.events.length > 0 ? 'OK' : 'NO_DATA';
    trip.lastPollMessage = result.rawMessage;
    await trip.save();

    return { newEventsCount };
  } catch (err) {
    console.error(`[Scheduler Error] Vehicle ${trip.vehicleNumber}: ${err.message}`);
    return { newEventsCount: 0, error: err.message };
  }
}

/**
 * Main cycle: process all active trips
 */
async function processAllActiveTrips() {
  if (isSchedulerRunning) {
    console.log('[Scheduler] Previous polling cycle still in progress, skipping tick.');
    return;
  }

  isSchedulerRunning = true;
  try {
    const now = new Date();

    // 0. Auto-sync any newly entered loading slips from SMTS database
    try {
      const { syncSlipsFromSMTS } = require('./smtsSyncService');
      const syncResult = await syncSlipsFromSMTS({ daysBack: 3 });
      if (syncResult && syncResult.syncedCount > 0) {
        console.log(`[Scheduler] Auto-synced ${syncResult.syncedCount} new vehicle(s) from SMTS Loading Slips`);
      }
    } catch (e) {
      console.warn(`[Scheduler] SMTS Slip Sync skipped: ${e.message}`);
    }

    // 1. Activate any scheduled trips whose start date has arrived
    await Trip.updateMany(
      { status: 'SCHEDULED', startDate: { $lte: now } },
      { $set: { status: 'ACTIVE', startedAt: now } }
    );

    // 2. Auto-complete trips whose end date has passed
    const expiredTrips = await Trip.find({
      status: 'ACTIVE',
      endDate: { $lte: now },
    });

    for (const trip of expiredTrips) {
      trip.status = 'COMPLETED';
      trip.endedAt = now;
      await trip.save();
      console.log(
        `[Scheduler] Marked trip ${trip.vehicleNumber} as COMPLETED (end date reached)`
      );
    }

    // 3. Find remaining ACTIVE trips
    const activeTrips = await Trip.find({ status: 'ACTIVE' });
    if (activeTrips.length === 0) {
      // No active trips to poll
      return;
    }

    console.log(
      `[Scheduler] Polling ${activeTrips.length} active vehicle(s) at ${now.toLocaleTimeString()}...`
    );

    for (const trip of activeTrips) {
      const { newEventsCount } = await pollTripData(trip);
      if (newEventsCount > 0) {
        console.log(
          `[Scheduler] Captured ${newEventsCount} new toll event(s) for vehicle ${trip.vehicleNumber}`
        );
      }
      // Brief delay (300ms) between vehicle requests to prevent network spikes
      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    console.error(`[Scheduler] Cycle error: ${err.message}`);
  } finally {
    isSchedulerRunning = false;
  }
}

/**
 * Cleanup expired trips and orphan toll events (older than 30 days past endedAt)
 */
async function cleanupOldTripsAndOrphans() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find trips completed more than 30 days ago
    const pastTrips = await Trip.find({
      status: 'COMPLETED',
      endedAt: { $lt: thirtyDaysAgo },
    })
      .select('_id vehicleNumber endedAt')
      .lean();

    for (const trip of pastTrips) {
      console.log(
        `[Scheduler Cleanup] Purging trip and tolls for vehicle ${trip.vehicleNumber} ended on ${trip.endedAt}`
      );
      await TollEvent.deleteMany({ tripId: trip._id });
      await Trip.deleteOne({ _id: trip._id });
    }

    // Also delete any orphan toll events whose trip does not exist
    const existingTripIds = await Trip.find().distinct('_id');
    const orphanResult = await TollEvent.deleteMany({
      tripId: { $nin: existingTripIds },
    });
    if (orphanResult.deletedCount > 0) {
      console.log(
        `[Scheduler Cleanup] Removed ${orphanResult.deletedCount} orphaned toll event(s).`
      );
    }
  } catch (err) {
    console.error(`[Scheduler Cleanup Error]: ${err.message}`);
  }
}

/**
 * Start the background cron jobs
 */
function startTrackingScheduler() {
  const intervalSec = parseInt(process.env.POLL_INTERVAL_SECONDS || '1800', 10);
  console.log(`[Scheduler] Initialized. Polling interval: ${intervalSec} seconds (${Math.round(intervalSec / 60)} minutes).`);

  // Interval timer runs every intervalSec seconds
  setInterval(() => {
    processAllActiveTrips();
  }, intervalSec * 1000);

  // Run cleanup once every day at 02:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('[Scheduler] Running daily 30-day retention cleanup...');
    cleanupOldTripsAndOrphans();
  });

  // Run initial poll shortly after server starts up
  setTimeout(() => {
    processAllActiveTrips();
  }, 3000);
}

module.exports = {
  startTrackingScheduler,
  pollTripData,
  processAllActiveTrips,
  cleanupOldTripsAndOrphans,
};

