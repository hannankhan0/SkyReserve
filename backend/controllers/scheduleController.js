const Schedule = require('../models/Schedule');
const { generateSeats } = require('../utils/seatGenerator');
const { getConnection, sql } = require('../config/db');

exports.createSchedule = async (req, res) => {
    try {
        const { flight_id, departure_time, arrival_time, flight_date } = req.body;

        if (!flight_id || !departure_time || !arrival_time || !flight_date) {
            return res.status(400).json({
                message: 'flight_id, departure_time, arrival_time, and flight_date are required'
            });
        }

        if (new Date(departure_time) >= new Date(arrival_time)) {
            return res.status(400).json({ message: 'departure_time must be before arrival_time' });
        }

        const pool = await getConnection();
        const flightResult = await pool.request()
            .input('flight_id', sql.Int, flight_id)
            .query(`
                SELECT a.total_seats
                FROM Flights f
                JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
                WHERE f.flight_id = @flight_id
            `);

        if (!flightResult.recordset.length) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        const available_seats = flightResult.recordset[0].total_seats;

        const scheduleId = await Schedule.create({
            ...req.body,
            available_seats
        });

        await generateSeats(scheduleId, flight_id);

        res.status(201).json({
            message: 'Schedule created and seats generated successfully',
            data: { schedule_id: scheduleId }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.findAll();
        res.json({ data: schedules });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getScheduleById = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ data: schedule });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const validStatuses = ['on_time', 'delayed', 'cancelled', 'boarding'];
        const { status } = req.body;

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }


        const { departure_time, arrival_time } = req.body;
        if (departure_time && arrival_time && new Date(departure_time) >= new Date(arrival_time)) {
            return res.status(400).json({ message: 'departure_time must be before arrival_time' });
        }

        const updated = await Schedule.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const deleted = await Schedule.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    } catch (err) {
        if (err.message && err.message.includes('REFERENCE')) {
            return res.status(409).json({
                message: 'Cannot delete schedule — active bookings exist for this schedule'
            });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};