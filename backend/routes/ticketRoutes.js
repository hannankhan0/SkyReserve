const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const {
  getMyTickets,
  getTicketById,
  checkInTicket,
  downloadTicket
} = require('../controllers/ticketController');

router.get('/my-tickets', auth, getMyTickets);
router.get('/:id/download', auth, downloadTicket);
router.put('/:id/check-in', adminAuth, checkInTicket);
router.get('/:id', auth, getTicketById);

module.exports = router;
