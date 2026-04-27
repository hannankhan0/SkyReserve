const Booking = require('../models/Booking');

const getUserIdFromRequest = (req) => req.user?.user_id || req.body.user_id || req.headers['x-user-id'];

const createBooking = async (req, res) => {
  try {
    const user_id = Number(getUserIdFromRequest(req));
    const { schedule_id, passengers, special_requests } = req.body;

    if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required' });
    if (!schedule_id || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ success: false, message: 'schedule_id and passengers array are required' });
    }
    for (const passenger of passengers) {
      if (!passenger.seat_id || !passenger.passenger_name || String(passenger.passenger_name).trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Each passenger must have passenger_name and seat_id' });
      }
    }

    const result = await Booking.createBooking({ user_id, schedule_id, passengers, special_requests });
    res.status(201).json({ success: true, message: 'Booking created successfully', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const user_id = Number(getUserIdFromRequest(req));
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required' });
    const bookings = await Booking.getMyBookings(user_id);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (req.user?.role_type !== 'admin' && Number(booking.user_id) !== Number(req.user?.user_id)) {
      return res.status(403).json({ success: false, message: 'You can only view your own booking' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const existing = await Booking.getBookingById(Number(req.params.id));
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (req.user?.role_type !== 'admin' && Number(existing.user_id) !== Number(req.user?.user_id)) {
      return res.status(403).json({ success: false, message: 'You can only confirm your own booking' });
    }
    const booking = await Booking.confirmBooking(Number(req.params.id));
    res.json({ success: true, message: 'Booking confirmed successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const existing = await Booking.getBookingById(Number(req.params.id));
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (req.user?.role_type !== 'admin' && Number(existing.user_id) !== Number(req.user?.user_id)) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own booking' });
    }
    const result = await Booking.cancelBooking(Number(req.params.id));
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.getAllBookings();
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.getBookingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, confirmBooking, cancelBooking, getAllBookings, getBookingStats };
