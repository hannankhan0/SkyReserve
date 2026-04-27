const Ticket = require('../models/Ticket');
const { generateTicketPDF } = require('../utils/pdfGenerator');

const getUserIdFromRequest = (req) => req.user?.user_id || req.body.user_id || req.headers['x-user-id'];

const ensureTicketAccess = (req, ticket) => {
  return req.user?.role_type === 'admin' || Number(ticket.user_id) === Number(req.user?.user_id);
};

const getMyTickets = async (req, res) => {
  try {
    const user_id = Number(getUserIdFromRequest(req));
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required' });
    const tickets = await Ticket.getMyTickets(user_id);
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.getTicketById(Number(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (!ensureTicketAccess(req, ticket)) return res.status(403).json({ success: false, message: 'You can only view your own ticket' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkInTicket = async (req, res) => {
  try {
    const ticket = await Ticket.checkInTicket(Number(req.params.id));
    res.json({ success: true, message: 'Ticket checked in successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTicket = async (req, res) => {
  try {
    const ticket = await Ticket.getTicketById(Number(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (!ensureTicketAccess(req, ticket)) return res.status(403).json({ success: false, message: 'You can only download your own ticket' });
    if (!['confirmed', 'completed'].includes(ticket.booking_status)) {
      return res.status(400).json({ success: false, message: 'Ticket can only be downloaded after booking confirmation' });
    }
    generateTicketPDF(ticket, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyTickets, getTicketById, checkInTicket, downloadTicket };
