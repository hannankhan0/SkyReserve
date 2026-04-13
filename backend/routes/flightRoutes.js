const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// ─────────────────────────────────────────────
// FEATURE 2 + 3: FLIGHT MANAGEMENT & SEARCH ROUTES
// Base: /api/flights
// ─────────────────────────────────────────────

// ── IMPORTANT: specific routes must come BEFORE /:id ──

// GET  /api/flights/search      — Search with filters (Feature 3)
router.get('/search', flightController.searchFlights);

// GET  /api/flights/routes      — Get all city pair routes (Feature 3)
router.get('/routes', flightController.getAvailableRoutes);

// GET  /api/flights/stats       — Flight statistics (Admin) (Feature 2)
router.get('/stats', flightController.getFlightStats);

// GET  /api/flights             — Get all flights
router.get('/', flightController.getAllFlights);

// POST /api/flights             — Add new flight (Admin only)
router.post('/', flightController.addFlight);

// GET  /api/flights/:id         — Get single flight details
router.get('/:id', flightController.getFlightById);

// PUT  /api/flights/:id         — Update flight (Admin only)
router.put('/:id', flightController.updateFlight);

// DELETE /api/flights/:id       — Delete flight (Admin only)
router.delete('/:id', flightController.deleteFlight);

module.exports = router;