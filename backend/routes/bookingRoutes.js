const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const {
  createBooking,
  getMyBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  getAllBookings,
  getBookingStats
} = require('../controllers/bookingController');

router.post('/', auth, createBooking);
router.get('/my-bookings', auth, getMyBookings);
router.get('/stats', adminAuth, getBookingStats);
router.get('/', adminAuth, getAllBookings);
router.get('/:id', auth, getBookingById);
router.put('/:id/confirm', auth, confirmBooking);
router.post('/:id/cancel', auth, cancelBooking);

module.exports = router;
