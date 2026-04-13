const { sql, poolPromise } = require('../config/db');

// ─────────────────────────────────────────────
// FEATURE 2 & 3: FLIGHT MANAGEMENT + SEARCH
// ─────────────────────────────────────────────

/**
 * Add a new flight
 * Note: aircraft_id references the Aircraft table
 */
const createFlight = async (data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_number',    sql.VarChar(10),    data.flight_number)
        .input('airline_name',     sql.VarChar(100),   data.airline_name)
        .input('departure_city',   sql.VarChar(100),   data.departure_city)
        .input('destination_city', sql.VarChar(100),   data.destination_city)
        .input('aircraft_id',      sql.Int,            data.aircraft_id)
        .input('base_price',       sql.Decimal(10, 2), data.base_price)
        .query(`
            INSERT INTO Flights 
                (flight_number, airline_name, departure_city, destination_city, aircraft_id, base_price)
            OUTPUT INSERTED.*
            VALUES 
                (@flight_number, @airline_name, @departure_city, @destination_city, @aircraft_id, @base_price)
        `);
    return result.recordset[0];
};

/**
 * Get all flights (joined with Aircraft for seat info)
 */
const getAllFlights = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                f.flight_id,
                f.flight_number,
                f.airline_name,
                f.departure_city,
                f.destination_city,
                f.base_price,
                f.created_at,
                a.aircraft_id,
                a.aircraft_type,
                a.manufacturer,
                a.model,
                a.total_seats,
                a.economy_seats,
                a.business_seats,
                a.first_class_seats
            FROM Flights f
            INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
            ORDER BY f.flight_number
        `);
    return result.recordset;
};

/**
 * Get single flight by ID (joined with Aircraft + schedule summary)
 */
const getFlightById = async (flight_id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_id', sql.Int, flight_id)
        .query(`
            SELECT 
                f.flight_id,
                f.flight_number,
                f.airline_name,
                f.departure_city,
                f.destination_city,
                f.base_price,
                f.created_at,
                a.aircraft_id,
                a.aircraft_type,
                a.manufacturer,
                a.model,
                a.total_seats,
                a.economy_seats,
                a.business_seats,
                a.first_class_seats,
                a.max_range_km,
                a.cruise_speed_kmh,
                COUNT(fs.schedule_id)                                        AS total_schedules,
                SUM(CASE WHEN fs.status = 'on_time'   THEN 1 ELSE 0 END)    AS on_time_count,
                SUM(CASE WHEN fs.status = 'delayed'   THEN 1 ELSE 0 END)    AS delayed_count,
                SUM(CASE WHEN fs.status = 'cancelled' THEN 1 ELSE 0 END)    AS cancelled_count
            FROM Flights f
            INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
            LEFT JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
            WHERE f.flight_id = @flight_id
            GROUP BY
                f.flight_id, f.flight_number, f.airline_name,
                f.departure_city, f.destination_city, f.base_price, f.created_at,
                a.aircraft_id, a.aircraft_type, a.manufacturer, a.model,
                a.total_seats, a.economy_seats, a.business_seats, a.first_class_seats,
                a.max_range_km, a.cruise_speed_kmh
        `);
    return result.recordset[0];
};

/**
 * Update flight details (only fields stored on Flights table)
 * Seat counts live on Aircraft — to change them, update Aircraft separately
 */
const updateFlight = async (flight_id, data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_id',        sql.Int,            flight_id)
        .input('airline_name',     sql.VarChar(100),   data.airline_name     || null)
        .input('departure_city',   sql.VarChar(100),   data.departure_city   || null)
        .input('destination_city', sql.VarChar(100),   data.destination_city || null)
        .input('aircraft_id',      sql.Int,            data.aircraft_id      || null)
        .input('base_price',       sql.Decimal(10, 2), data.base_price       || null)
        .query(`
            UPDATE Flights
            SET
                airline_name     = COALESCE(@airline_name,     airline_name),
                departure_city   = COALESCE(@departure_city,   departure_city),
                destination_city = COALESCE(@destination_city, destination_city),
                aircraft_id      = COALESCE(@aircraft_id,      aircraft_id),
                base_price       = COALESCE(@base_price,       base_price)
            OUTPUT INSERTED.*
            WHERE flight_id = @flight_id
        `);
    return result.recordset[0];
};

/**
 * Delete a flight by ID
 */
const deleteFlight = async (flight_id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_id', sql.Int, flight_id)
        .query(`DELETE FROM Flights OUTPUT DELETED.* WHERE flight_id = @flight_id`);
    return result.recordset[0];
};

/**
 * FEATURE 3: Search flights with multiple optional filters
 */
const searchFlights = async (filters) => {
    const pool = await poolPromise;
    const request = pool.request();

    const conditions = [`fs.status != 'cancelled'`];

    if (filters.departure_city) {
        conditions.push(`f.departure_city = @departure_city`);
        request.input('departure_city', sql.VarChar(100), filters.departure_city);
    }
    if (filters.destination_city) {
        conditions.push(`f.destination_city = @destination_city`);
        request.input('destination_city', sql.VarChar(100), filters.destination_city);
    }
    if (filters.flight_date) {
        conditions.push(`fs.flight_date = @flight_date`);
        request.input('flight_date', sql.Date, filters.flight_date);
    } /*else {
        conditions.push(`fs.flight_date >= CAST(GETDATE() AS DATE)`);
    }*/
    if (filters.min_price) {
        conditions.push(`f.base_price >= @min_price`);
        request.input('min_price', sql.Decimal(10, 2), parseFloat(filters.min_price));
    }
    if (filters.max_price) {
        conditions.push(`f.base_price <= @max_price`);
        request.input('max_price', sql.Decimal(10, 2), parseFloat(filters.max_price));
    }
    if (filters.airline_name) {
        conditions.push(`f.airline_name LIKE @airline_name`);
        request.input('airline_name', sql.VarChar(100), `%${filters.airline_name}%`);
    }
    if (filters.aircraft_type) {
        conditions.push(`a.aircraft_type LIKE @aircraft_type`);
        request.input('aircraft_type', sql.VarChar(50), `%${filters.aircraft_type}%`);
    }

    const sortMap = {
        price_asc:    'f.base_price ASC',
        price_desc:   'f.base_price DESC',
        time_asc:     'fs.departure_time ASC',
        time_desc:    'fs.departure_time DESC',
        duration_asc: 'DATEDIFF(MINUTE, fs.departure_time, fs.arrival_time) ASC',
    };
    const orderBy = sortMap[filters.sort_by] || 'fs.flight_date ASC, fs.departure_time ASC';
    const whereClause = conditions.join(' AND ');

    const result = await request.query(`
        SELECT
            f.flight_id,
            f.flight_number,
            f.airline_name,
            f.departure_city,
            f.destination_city,
            a.aircraft_type,
            a.total_seats,
            a.economy_seats,
            a.business_seats,
            a.first_class_seats,
            fs.schedule_id,
            fs.flight_date,
            FORMAT(fs.departure_time, 'hh:mm tt') AS departure_time,
            FORMAT(fs.arrival_time,   'hh:mm tt') AS arrival_time,
            DATEDIFF(MINUTE, fs.departure_time, fs.arrival_time) AS duration_minutes,
            fs.status,
            fs.gate_number,
            fs.available_seats,
            f.base_price,
            (f.base_price * 1.50) AS business_price,
            (f.base_price * 2.00) AS first_class_price
        FROM Flights f
        INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
        INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
    `);
    return result.recordset;
};

/**
 * Get all unique city pair routes
 */
const getAvailableRoutes = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT DISTINCT
                departure_city,
                destination_city,
                departure_city + ' → ' + destination_city AS route,
                COUNT(*) AS flight_count,
                MIN(base_price) AS starting_from
            FROM Flights
            GROUP BY departure_city, destination_city
            ORDER BY departure_city, destination_city
        `);
    return result.recordset;
};

/**
 * Flight statistics — admin only
 */
const getFlightStats = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT
                f.flight_id,
                f.flight_number,
                f.departure_city + ' → ' + f.destination_city AS route,
                f.airline_name,
                f.base_price,
                a.aircraft_type,
                COUNT(DISTINCT b.booking_id)                        AS total_bookings,
                COALESCE(SUM(b.total_passengers), 0)                AS total_passengers,
                COALESCE(SUM(b.total_amount), 0)                    AS total_revenue,
                COALESCE(AVG(CAST(b.total_amount AS FLOAT)), 0)     AS avg_booking_value,
                SUM(CASE WHEN b.booking_status = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed_bookings,
                SUM(CASE WHEN b.booking_status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled_bookings
            FROM Flights f
            INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
            LEFT JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
            LEFT JOIN Bookings b ON fs.schedule_id = b.schedule_id
            GROUP BY f.flight_id, f.flight_number, f.departure_city, f.destination_city,
                     f.airline_name, f.base_price, a.aircraft_type
            ORDER BY total_revenue DESC
        `);
    return result.recordset;
};

module.exports = {
    createFlight,
    getAllFlights,
    getFlightById,
    updateFlight,
    deleteFlight,
    searchFlights,
    getAvailableRoutes,
    getFlightStats,
};