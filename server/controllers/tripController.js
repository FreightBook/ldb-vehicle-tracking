const Trip = require('../models/Trip');
const TollEvent = require('../models/TollEvent');
const { pollTripData } = require('../services/trackingScheduler');
const { generateTruckReportPDF } = require('../services/pdfGenerator');
const { resolveLocation } = require('../services/locationService');

/**
 * Normalizes vehicle number by removing spaces and dashes, uppercase
 */
function cleanVehicleNumber(val) {
  return (val || '').toUpperCase().replace(/[\s-]/g, '').trim();
}

/**
 * POST /api/trips
 * Register a new tracking trip
 */
async function createTrip(req, res) {
  try {
    const {
      vehicleNumber,
      startDate,
      endDate,
      origin,
      destination,
      originCoords,
      destinationCoords,
      estimatedDistanceKm,
      suggestedDurationDays,
    } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const cleanedNumber = cleanVehicleNumber(vehicleNumber);
    if (cleanedNumber.length < 5) {
      return res.status(400).json({ error: 'Please enter a valid vehicle number' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both start date and end date are required' });
    }

    // Parse dates
    // startDate set to 00:00:00.000 local
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

    if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) {
      return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
    }

    const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    // End date ends at 23:59:50
    const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 50, 0);

    // Current date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rule: Start date cannot be before today
    if (start < today) {
      return res.status(400).json({
        error: `Start date cannot be in the past. It must be today (${today.toISOString().split('T')[0]}) or later.`,
      });
    }

    // Rule: End date cannot be before start date
    if (end < start) {
      return res.status(400).json({
        error: 'End date cannot be earlier than start date.',
      });
    }

    // Rule: End date cannot be more than 30 days after start date
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      return res.status(400).json({
        error: 'End date cannot be more than 30 days after start date.',
      });
    }

    // Check if vehicle already has an active or scheduled trip
    const existingActive = await Trip.findOne({
      vehicleNumber: cleanedNumber,
      status: { $in: ['ACTIVE', 'SCHEDULED'] },
    });

    if (existingActive) {
      return res.status(400).json({
        error: `Vehicle ${cleanedNumber} already has an active tracking session running.`,
      });
    }

    const isStartToday = start <= new Date();
    const initialStatus = isStartToday ? 'ACTIVE' : 'SCHEDULED';

    let oCoords = originCoords;
    if ((!oCoords || typeof oCoords.lat !== 'number') && origin) {
      const resolved = resolveLocation(origin);
      if (resolved) oCoords = { lat: resolved.lat, lng: resolved.lng };
    }

    let dCoords = destinationCoords;
    if ((!dCoords || typeof dCoords.lat !== 'number') && destination) {
      const resolved = resolveLocation(destination);
      if (resolved) dCoords = { lat: resolved.lat, lng: resolved.lng };
    }

    const trip = await Trip.create({
      vehicleNumber: cleanedNumber,
      startDate: start,
      endDate: end,
      origin: origin ? String(origin).trim() : '',
      destination: destination ? String(destination).trim() : '',
      originCoords: oCoords || undefined,
      destinationCoords: dCoords || undefined,
      estimatedDistanceKm: typeof estimatedDistanceKm === 'number' ? Math.round(estimatedDistanceKm) : null,
      suggestedDurationDays: typeof suggestedDurationDays === 'number' ? Math.round(suggestedDurationDays) : null,
      status: initialStatus,
      startedAt: isStartToday ? new Date() : null,
      totalTolls: 0,
    });

    // If active immediately, trigger initial background poll right away
    if (initialStatus === 'ACTIVE') {
      pollTripData(trip).catch((err) => {
        console.error(`[Initial Poll Error] ${trip.vehicleNumber}: ${err.message}`);
      });
    }

    return res.status(201).json({
      message: 'Trip registered successfully',
      trip,
    });
  } catch (err) {
    console.error(`[createTrip Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/trips
 * Query trips by status: 'ACTIVE' or 'COMPLETED'
 */
async function getTrips(req, res) {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status === 'ACTIVE') {
      filter.status = { $in: ['ACTIVE', 'SCHEDULED'] };
    } else if (status === 'COMPLETED' || status === 'PAST') {
      filter.status = 'COMPLETED';
    }

    if (search && search.trim()) {
      const cleaned = cleanVehicleNumber(search);
      const text = search.trim();
      const orQuery = [
        { vehicleNumber: { $regex: cleaned || text, $options: 'i' } },
        { origin: { $regex: text, $options: 'i' } },
        { destination: { $regex: text, $options: 'i' } },
      ];
      filter.$or = orQuery;
    }

    const activeFilter = { status: { $in: ['ACTIVE', 'SCHEDULED'] } };
    const pastFilter = { status: 'COMPLETED' };

    if (search && search.trim()) {
      const cleaned = cleanVehicleNumber(search);
      const text = search.trim();
      const orQuery = [
        { vehicleNumber: { $regex: cleaned || text, $options: 'i' } },
        { origin: { $regex: text, $options: 'i' } },
        { destination: { $regex: text, $options: 'i' } },
      ];
      activeFilter.$or = orQuery;
      pastFilter.$or = orQuery;
    }

    const [trips, activeCount, pastCount] = await Promise.all([
      Trip.find(filter).sort({ createdAt: -1 }).lean(),
      Trip.countDocuments(activeFilter),
      Trip.countDocuments(pastFilter),
    ]);

    // Ensure originCoords and destinationCoords are resolved for all trips
    for (const t of trips) {
      if (t.origin && (!t.originCoords || typeof t.originCoords.lat !== 'number')) {
        const resO = resolveLocation(t.origin);
        if (resO) {
          t.originCoords = { lat: resO.lat, lng: resO.lng };
          Trip.updateOne({ _id: t._id }, { $set: { originCoords: t.originCoords } }).exec();
        }
      }
      if (t.destination && (!t.destinationCoords || typeof t.destinationCoords.lat !== 'number')) {
        const resD = resolveLocation(t.destination);
        if (resD) {
          t.destinationCoords = { lat: resD.lat, lng: resD.lng };
          Trip.updateOne({ _id: t._id }, { $set: { destinationCoords: t.destinationCoords } }).exec();
        }
      }
    }

    const pollIntervalSeconds = parseInt(process.env.POLL_INTERVAL_SECONDS || '1800', 10);

    return res.json({ trips, activeCount, pastCount, pollIntervalSeconds });
  } catch (err) {
    console.error(`[getTrips Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/trips/:id
 * Retrieve trip details and all associated toll events
 */
async function getTripById(req, res) {
  try {
    const trip = await Trip.findById(req.params.id).lean();
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Auto-resolve originCoords and destinationCoords if missing
    if (trip.origin && (!trip.originCoords || typeof trip.originCoords.lat !== 'number')) {
      const resO = resolveLocation(trip.origin);
      if (resO) {
        trip.originCoords = { lat: resO.lat, lng: resO.lng };
        Trip.updateOne({ _id: trip._id }, { $set: { originCoords: trip.originCoords } }).exec();
      }
    }
    if (trip.destination && (!trip.destinationCoords || typeof trip.destinationCoords.lat !== 'number')) {
      const resD = resolveLocation(trip.destination);
      if (resD) {
        trip.destinationCoords = { lat: resD.lat, lng: resD.lng };
        Trip.updateOne({ _id: trip._id }, { $set: { destinationCoords: trip.destinationCoords } }).exec();
      }
    }

    // Chronological order: oldest to newest (lean plain object for low memory)
    const events = await TollEvent.find({ tripId: trip._id })
      .sort({ eventTimestamp: 1 })
      .lean();

    return res.json({ trip, events });
  } catch (err) {
    console.error(`[getTripById Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/trips/:id/poll
 * Manually trigger an instant poll for a specific trip
 */
async function manualPollTrip(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'ACTIVE') {
      return res
        .status(400)
        .json({ error: 'Can only refresh tracking for ACTIVE trips.' });
    }

    const pollResult = await pollTripData(trip);
    const updatedTrip = await Trip.findById(trip._id).lean();
    const events = await TollEvent.find({ tripId: trip._id })
      .sort({ eventTimestamp: 1 })
      .lean();

    return res.json({
      message: 'Vehicle polled successfully',
      trip: updatedTrip,
      events,
      newEventsCount: pollResult.newEventsCount,
    });
  } catch (err) {
    console.error(`[manualPollTrip Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/trips/:id/end
 * Manually end tracking
 */
async function endTrip(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.status = 'COMPLETED';
    trip.endedAt = new Date();
    await trip.save();

    console.log(`[Manual End] Vehicle ${trip.vehicleNumber} tracking stopped by user.`);

    return res.json({
      message: 'Tracking stopped successfully',
      trip,
    });
  } catch (err) {
    console.error(`[endTrip Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/trips/:id
 * Delete trip and associated toll logs
 */
async function deleteTrip(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await TollEvent.deleteMany({ tripId: trip._id });
    await Trip.deleteOne({ _id: trip._id });

    return res.json({ message: 'Trip and toll records deleted successfully' });
  } catch (err) {
    console.error(`[deleteTrip Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/trips/:id/pdf
 * Download Truck Tracking Report PDF
 */
async function downloadTripPdf(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const events = await TollEvent.find({ tripId: trip._id })
      .sort({ eventTimestamp: 1 })
      .lean();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Truck_Report_${trip.vehicleNumber}.pdf"`
    );

    generateTruckReportPDF(trip, events, res);
  } catch (err) {
    console.error(`[downloadTripPdf Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  manualPollTrip,
  endTrip,
  deleteTrip,
  downloadTripPdf,
};

