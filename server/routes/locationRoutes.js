const express = require('express');
const router = express.Router();
const { searchLocations } = require('../services/locationService');

/**
 * GET /api/locations/pincode/:pin
 * Direct 6-digit Indian PIN code lookup
 */
router.get('/pincode/:pin', (req, res) => {
  const pin = (req.params.pin || '').trim();
  try {
    const results = searchLocations(pin, 1);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: `No Indian location found for PIN code ${pin}.`, success: false });
    }
    const loc = results[0];
    return res.json({
      success: true,
      city: loc.name,
      district: loc.district,
      state: loc.state,
      pincode: loc.pincode,
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label,
    });
  } catch (err) {
    console.error(`[Location Pincode Error] ${err.message}`);
    return res.status(500).json({ error: 'Failed to lookup PIN code', success: false });
  }
});

/**
 * GET /api/locations/search?q=...&limit=10
 * Fast search by City name, Town, District, State, or 6-digit Indian PIN code
 */
router.get('/search', (req, res) => {
  const query = (req.query.q || '').trim();
  const limit = Math.min(25, Math.max(1, parseInt(req.query.limit || '10', 10)));

  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const results = searchLocations(query, limit);
    return res.json({ results });
  } catch (err) {
    console.error(`[Location Search Error] ${err.message}`);
    return res.status(500).json({ error: 'Failed to search locations', results: [] });
  }
});

module.exports = router;
