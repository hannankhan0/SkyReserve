const { sql, poolPromise } = require('../config/db');

/**
 * GET /api/cities
 * Returns all cities from the Cities lookup table.
 * Used by the frontend AddFlightForm to populate city dropdowns.
 */
const getAllCities = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT city_id, city_name, country, iata_code
            FROM Cities
            ORDER BY city_name
        `);
        res.json({ success: true, count: result.recordset.length, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllCities };
