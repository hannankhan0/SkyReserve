const express = require('express');
const router = express.Router();

const {
  getMyTickets,
  getTicketById,
  checkInTicket,
  downloadTicket
} = require('../controllers/ticketController');

router.get('/my-tickets', getMyTickets);
router.get('/:id/download', downloadTicket);
router.put('/:id/check-in', checkInTicket);
router.get('/:id', getTicketById);

module.exports = router;