const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  getAllBookings,
  getBookingStats
} = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/stats', getBookingStats);
router.get('/:id', getBookingById);
router.put('/:id/confirm', confirmBooking);
router.post('/:id/cancel', cancelBooking);
router.get('/', getAllBookings);

module.exports = router;