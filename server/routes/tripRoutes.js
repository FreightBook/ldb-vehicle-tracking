const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  manualPollTrip,
  endTrip,
  deleteTrip,
  downloadTripPdf,
} = require('../controllers/tripController');

// Trip CRUD & Search
router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/:id/poll', manualPollTrip);
router.patch('/:id/end', endTrip);
router.delete('/:id', deleteTrip);
router.get('/:id/pdf', downloadTripPdf);

module.exports = router;

