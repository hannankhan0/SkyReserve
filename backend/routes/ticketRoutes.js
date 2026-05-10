const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const {
  getMyTickets,
  getTicketById,
  getTicketsByBookingReference,
  checkInTicket,
  downloadTicket
} = require('../controllers/ticketController');

router.get('/my-tickets', auth, getMyTickets);
router.get('/booking-reference/:reference', adminAuth, getTicketsByBookingReference);
router.get('/:id/download', auth, downloadTicket);
router.put('/:id/check-in', adminAuth, checkInTicket);
router.get('/:id', auth, getTicketById);

module.exports = router;
