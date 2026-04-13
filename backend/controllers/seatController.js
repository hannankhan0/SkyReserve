const Seat = require('../models/Seat');

exports.getSeatsBySchedule = async (req, res) => {
    const seats = await Seat.findBySchedule(req.params.scheduleId);
    res.json({ data: seats });
};

exports.getSeatMap = async (req, res) => {
    const seatMap = await Seat.getSeatMap(req.params.scheduleId);
    res.json({ data: seatMap });
};

exports.reserveSeats = async (req, res) => {
    const { seat_ids } = req.body;

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        return res.status(400).json({ message: 'Seat IDs array is required' });
    }

    const reserved = await Seat.reserve(seat_ids);
    res.json({ message: `${reserved} seats reserved successfully` });
};