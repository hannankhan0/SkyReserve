const Seat = require('../models/Seat');

exports.getSeatsBySchedule = async (req, res) => {
  try {
    const seats = await Seat.findBySchedule(req.params.scheduleId);
    res.json({ success: true, count: seats.length, data: seats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSeatMap = async (req, res) => {
  try {
    const seatMap = await Seat.getSeatMap(req.params.scheduleId);
    res.json({ success: true, count: seatMap.length, data: seatMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reserveSeats = async (req, res) => {
  try {
    const { seat_ids } = req.body;
    const userId = req.user?.user_id || req.body.user_id || req.headers['x-user-id'] || null;

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'seat_ids array is required' });
    }

    const reserved = await Seat.reserve(seat_ids, userId);
    res.json({ success: true, message: `${reserved} seats reserved successfully` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
