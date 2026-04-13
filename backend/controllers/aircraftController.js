const Aircraft = require('../models/Aircraft');


exports.createAircraft = async (req, res) => {
    try {
        const {
            aircraft_type,
            manufacturer,
            model,
            total_seats,
            economy_seats,
            business_seats,
            first_class_seats
        } = req.body;

        if (!aircraft_type || !manufacturer || !model) {
            return res.status(400).json({ message: 'aircraft_type, manufacturer, and model are required' });
        }
        if (total_seats == null || economy_seats == null || business_seats == null || first_class_seats == null) {
            return res.status(400).json({ message: 'total_seats, economy_seats, business_seats, and first_class_seats are required' });
        }

        if (parseInt(total_seats) !== parseInt(economy_seats) + parseInt(business_seats) + parseInt(first_class_seats)) {
            return res.status(400).json({
                message: 'total_seats must equal economy_seats + business_seats + first_class_seats'
            });
        }

        const aircraftId = await Aircraft.create(req.body);
        res.status(201).json({
            message: 'Aircraft created successfully',
            data: { aircraft_id: aircraftId }
        });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Aircraft type already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getAllAircraft = async (req, res) => {
    try {
        const aircraft = await Aircraft.findAll();
        res.json({ data: aircraft });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getAircraftStats = async (req, res) => {
    try {
        const stats = await Aircraft.getStats();
        res.json({ data: stats });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getAircraftById = async (req, res) => {
    try {
        const aircraft = await Aircraft.findById(req.params.id);
        if (!aircraft) {
            return res.status(404).json({ message: 'Aircraft not found' });
        }
        res.json({ data: aircraft });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.updateAircraft = async (req, res) => {
    try {
        const { total_seats, economy_seats, business_seats, first_class_seats } = req.body;

        // Validate seat totals if all four are provided
        if (total_seats != null && economy_seats != null && business_seats != null && first_class_seats != null) {
            if (parseInt(total_seats) !== parseInt(economy_seats) + parseInt(business_seats) + parseInt(first_class_seats)) {
                return res.status(400).json({
                    message: 'total_seats must equal economy_seats + business_seats + first_class_seats'
                });
            }
        }

        const updated = await Aircraft.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ message: 'Aircraft not found' });
        }
        res.json({ message: 'Aircraft updated successfully' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Aircraft type already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteAircraft = async (req, res) => {
    try {
        const deleted = await Aircraft.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Aircraft not found' });
        }
        res.json({ message: 'Aircraft deleted successfully' });
    } catch (err) {

        if (err.message && err.message.includes('REFERENCE')) {
            return res.status(409).json({
                message: 'Cannot delete aircraft — it is assigned to one or more flights'
            });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};