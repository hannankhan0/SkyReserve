const Flight = require('../models/flightModel');
const { validateFlight, validateSearchQuery } = require('../utils/validators');

// ─────────────────────────────────────────────
// FEATURE 2: FLIGHT MANAGEMENT (ADMIN)
// ─────────────────────────────────────────────

/**
 * POST /api/flights
 * Add a new flight — Admin only
 * Body: flight_number, airline_name, departure_city, destination_city, aircraft_id, base_price
 */
const addFlight = async (req, res) => {
    try {
        const errors = validateFlight(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const flight = await Flight.createFlight(req.body);
        res.status(201).json({
            success: true,
            message: 'Flight added successfully.',
            data: flight
        });
    } catch (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: 'Flight number already exists.'
            });
        }
        // Foreign key violation — aircraft_id not found
        if (err.message.includes('FOREIGN KEY') || err.message.includes('FK_')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid aircraft_id — no matching aircraft found.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/flights
 * Get all flights (with aircraft details via JOIN)
 */
const getAllFlights = async (req, res) => {
    try {
        const flights = await Flight.getAllFlights();
        res.status(200).json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/flights/:id
 * Get single flight with aircraft info + schedule summary
 */
const getFlightById = async (req, res) => {
    try {
        const flight_id = parseInt(req.params.id);
        if (isNaN(flight_id)) {
            return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
        }

        const flight = await Flight.getFlightById(flight_id);
        if (!flight) {
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }

        res.status(200).json({ success: true, data: flight });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/flights/:id
 * Update flight details — Admin only
 * Updatable fields: airline_name, departure_city, destination_city, aircraft_id, base_price
 */
const updateFlight = async (req, res) => {
    try {
        const flight_id = parseInt(req.params.id);
        if (isNaN(flight_id)) {
            return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
        }

        const errors = validateFlight(req.body, true); // isUpdate = true
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const updated = await Flight.updateFlight(flight_id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Flight updated successfully.',
            data: updated
        });
    } catch (err) {
        if (err.message.includes('FOREIGN KEY') || err.message.includes('FK_')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid aircraft_id — no matching aircraft found.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * DELETE /api/flights/:id
 * Delete a flight — Admin only
 */
const deleteFlight = async (req, res) => {
    try {
        const flight_id = parseInt(req.params.id);
        if (isNaN(flight_id)) {
            return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
        }

        const deleted = await Flight.deleteFlight(flight_id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Flight deleted successfully.',
            data: deleted
        });
    } catch (err) {
        if (err.message.includes('REFERENCE') || err.message.includes('FK_')) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete flight — it has existing schedules or bookings.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/flights/stats
 * Flight statistics — Admin only
 */
const getFlightStats = async (req, res) => {
    try {
        const stats = await Flight.getFlightStats();
        res.status(200).json({
            success: true,
            count: stats.length,
            data: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// FEATURE 3: FLIGHT SEARCH
// ─────────────────────────────────────────────

/**
 * GET /api/flights/search
 * Search flights with any combination of filters
 *
 * Query params (all optional):
 *   departure_city, destination_city, flight_date
 *   min_price, max_price
 *   airline_name, aircraft_type
 *   sort_by: price_asc | price_desc | time_asc | time_desc | duration_asc
 */
const searchFlights = async (req, res) => {
    try {
        const errors = validateSearchQuery(req.query);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const results = await Flight.searchFlights(req.query);

        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                message: 'No flights found matching your search.',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/flights/routes
 * Get all available city pair routes with starting prices
 */
const getAvailableRoutes = async (req, res) => {
    try {
        const routes = await Flight.getAvailableRoutes();
        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    addFlight,
    getAllFlights,
    getFlightById,
    updateFlight,
    deleteFlight,
    getFlightStats,
    searchFlights,
    getAvailableRoutes,
};