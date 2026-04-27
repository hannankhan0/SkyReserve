const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const adminAuth = require('../middleware/adminAuth');

// Public/user routes
router.get('/search', flightController.searchFlights);
router.get('/routes', flightController.getAvailableRoutes);

// Admin-only stats must come before /:id
router.get('/admin/stats', adminAuth, flightController.getFlightStats);
router.get('/stats', adminAuth, flightController.getFlightStats); // backward-compatible

router.get('/', flightController.getAllFlights);
router.get('/:id', flightController.getFlightById);

// Admin-only write routes
router.post('/', adminAuth, flightController.addFlight);
router.put('/:id', adminAuth, flightController.updateFlight);
router.delete('/:id', adminAuth, flightController.deleteFlight);

module.exports = router;
