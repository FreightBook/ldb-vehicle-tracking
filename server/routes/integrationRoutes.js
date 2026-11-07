const express = require('express');
const router = express.Router();
const { syncSlipsFromSMTS, processSlipToTrip, getSmtsConnection } = require('../services/smtsSyncService');

/**
 * POST /api/integrations/smts/sync
 * Manually or programmatically trigger synchronization from SMTS database
 */
router.post('/sync', async (req, res) => {
  try {
    const limit = parseInt(req.body.limit || req.query.limit || '30', 10);
    const daysBack = parseInt(req.body.daysBack || req.query.daysBack || '5', 10);

    const result = await syncSlipsFromSMTS({ limit, daysBack });
    return res.json({
      success: true,
      message:
        result.syncedCount > 0
          ? `Synced ${result.syncedCount} new vehicle(s) from SMTS Loading Slips!`
          : `All ${result.totalChecked} recent SMTS loading slips are already tracked.`,
      ...result,
    });
  } catch (err) {
    console.error(`[Integration Route Error] /sync: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/integrations/smts/webhook
 * Real-time webhook endpoint for when SMTS creates a loading slip
 */
router.post('/webhook', async (req, res) => {
  try {
    const slipData = req.body;
    if (!slipData || (!slipData.tempoNumber && !slipData.vehicleNumber)) {
      return res.status(400).json({ error: 'Loading slip data with tempoNumber is required' });
    }

    const result = await processSlipToTrip(slipData);
    if (!result) {
      return res.status(400).json({ error: 'Invalid vehicle number in loading slip' });
    }

    return res.status(201).json({
      success: true,
      status: result.status,
      message:
        result.status === 'CREATED'
          ? `Vehicle ${result.trip.vehicleNumber} registered for tracking from Slip #${result.slipNumber || 'N/A'}`
          : `Vehicle ${result.trip.vehicleNumber} is already being tracked.`,
      trip: result.trip,
    });
  } catch (err) {
    console.error(`[Integration Webhook Error]: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/integrations/smts/status
 * Check SMTS connection and total loading slips available
 */
router.get('/status', async (req, res) => {
  try {
    const conn = await getSmtsConnection();
    const isConnected = conn.readyState === 1;

    let totalSlips = null;
    if (isConnected) {
      const collection = conn.collection('loading_slip_data');
      totalSlips = await collection.countDocuments();
    }

    return res.json({
      success: true,
      connected: isConnected,
      totalSlipsInSMTS: totalSlips,
      smtsBaseUrl: process.env.SMTS_BASE_URL || 'https://smts-o3nc.onrender.com',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

module.exports = router;

