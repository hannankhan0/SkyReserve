const { sql, poolPromise } = require('../config/db');

// ─────────────────────────────────────────────
// FEATURE 2 & 3: FLIGHT MANAGEMENT + SEARCH
// (Updated for normalized schema)
// ─────────────────────────────────────────────

/**
 * Add a new flight
 * Accepts departure_city_id and destination_city_id (INT FK → Cities)
 */
const createFlight = async (data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_number',       sql.VarChar(10),    data.flight_number)
        .input('airline_name',        sql.VarChar(100),   data.airline_name)
        .input('departure_city_id',   sql.Int,            data.departure_city_id)
        .input('destination_city_id', sql.Int,            data.destination_city_id)
        .input('aircraft_id',         sql.Int,            data.aircraft_id)
        .input('base_price',          sql.Decimal(10, 2), data.base_price)
        .query(`
            INSERT INTO Flights
                (flight_number, airline_name, departure_city_id, destination_city_id, aircraft_id, base_price)
            OUTPUT INSERTED.*
            VALUES
                (@flight_number, @airline_name, @departure_city_id, @destination_city_id, @aircraft_id, @base_price)
        `);
    return result.recordset[0];
};

/**
 * Get all flights — joined with Aircraft and Cities for display names
 */
const getAllFlights = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT
                f.flight_id,
                f.flight_number,
                f.airline_name,
                dc.city_name   AS departure_city,
                dc.city_id     AS departure_city_id,
                ac2.city_name  AS destination_city,
                ac2.city_id    AS destination_city_id,
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
            INNER JOIN Aircraft a   ON f.aircraft_id          = a.aircraft_id
            INNER JOIN Cities   dc  ON f.departure_city_id    = dc.city_id
            INNER JOIN Cities   ac2 ON f.destination_city_id  = ac2.city_id
            ORDER BY f.flight_number
        `);
    return result.recordset;
};

/**
 * Get single flight by ID
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
                dc.city_name   AS departure_city,
                dc.city_id     AS departure_city_id,
                ac2.city_name  AS destination_city,
                ac2.city_id    AS destination_city_id,
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
            INNER JOIN Aircraft a   ON f.aircraft_id         = a.aircraft_id
            INNER JOIN Cities   dc  ON f.departure_city_id   = dc.city_id
            INNER JOIN Cities   ac2 ON f.destination_city_id = ac2.city_id
            LEFT  JOIN Flight_Schedules fs ON f.flight_id    = fs.flight_id
            WHERE f.flight_id = @flight_id
            GROUP BY
                f.flight_id, f.flight_number, f.airline_name,
                dc.city_name, dc.city_id, ac2.city_name, ac2.city_id,
                f.base_price, f.created_at,
                a.aircraft_id, a.aircraft_type, a.manufacturer, a.model,
                a.total_seats, a.economy_seats, a.business_seats, a.first_class_seats,
                a.max_range_km, a.cruise_speed_kmh
        `);
    return result.recordset[0];
};

/**
 * Update flight details — accepts city IDs for city changes
 */
const updateFlight = async (flight_id, data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('flight_id',           sql.Int,            flight_id)
        .input('airline_name',        sql.VarChar(100),   data.airline_name        || null)
        .input('departure_city_id',   sql.Int,            data.departure_city_id   || null)
        .input('destination_city_id', sql.Int,            data.destination_city_id || null)
        .input('aircraft_id',         sql.Int,            data.aircraft_id         || null)
        .input('base_price',          sql.Decimal(10, 2), data.base_price          || null)
        .query(`
            UPDATE Flights
            SET
                airline_name        = COALESCE(@airline_name,        airline_name),
                departure_city_id   = COALESCE(@departure_city_id,   departure_city_id),
                destination_city_id = COALESCE(@destination_city_id, destination_city_id),
                aircraft_id         = COALESCE(@aircraft_id,         aircraft_id),
                base_price          = COALESCE(@base_price,          base_price)
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
 * FEATURE 3: Search flights
 * available_seats is now computed live from Seats table (no column on Flight_Schedules)
 */
const searchFlights = async (filters) => {
    const pool = await poolPromise;
    const request = pool.request();

    const conditions = [
        `fs.status != 'cancelled'`,
        `(SELECT COUNT(*) FROM Seats s WHERE s.schedule_id = fs.schedule_id AND s.is_available = 1) > 0`
    ];

    if (filters.departure_city) {
        conditions.push(`dc.city_name = @departure_city`);
        request.input('departure_city', sql.VarChar(100), filters.departure_city);
    }
    if (filters.destination_city) {
        conditions.push(`ac2.city_name = @destination_city`);
        request.input('destination_city', sql.VarChar(100), filters.destination_city);
    }
    if (filters.flight_date) {
        conditions.push(`fs.flight_date = @flight_date`);
        request.input('flight_date', sql.Date, filters.flight_date);
    }
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
            dc.city_name   AS departure_city,
            ac2.city_name  AS destination_city,
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
            (SELECT COUNT(*) FROM Seats s WHERE s.schedule_id = fs.schedule_id AND s.is_available = 1) AS available_seats,
            f.base_price,
            (SELECT price_multiplier FROM Seat_Class_Prices WHERE seat_class = 'business')    * f.base_price AS business_price,
            (SELECT price_multiplier FROM Seat_Class_Prices WHERE seat_class = 'first_class') * f.base_price AS first_class_price
        FROM Flights f
        INNER JOIN Aircraft a   ON f.aircraft_id         = a.aircraft_id
        INNER JOIN Cities   dc  ON f.departure_city_id   = dc.city_id
        INNER JOIN Cities   ac2 ON f.destination_city_id = ac2.city_id
        INNER JOIN Flight_Schedules fs ON f.flight_id    = fs.flight_id
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
            SELECT
                dc.city_name   AS departure_city,
                ac2.city_name  AS destination_city,
                dc.city_name + ' → ' + ac2.city_name AS route,
                COUNT(DISTINCT fs.schedule_id) AS flight_count,
                MIN(f.base_price) AS starting_from
            FROM Flights f
            INNER JOIN Cities   dc  ON f.departure_city_id   = dc.city_id
            INNER JOIN Cities   ac2 ON f.destination_city_id = ac2.city_id
            INNER JOIN Flight_Schedules fs ON f.flight_id    = fs.flight_id
            WHERE fs.status != 'cancelled'
              AND (SELECT COUNT(*) FROM Seats s WHERE s.schedule_id = fs.schedule_id AND s.is_available = 1) > 0
            GROUP BY dc.city_name, ac2.city_name
            ORDER BY dc.city_name, ac2.city_name
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
                dc.city_name + ' → ' + ac2.city_name AS route,
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
            INNER JOIN Aircraft a   ON f.aircraft_id         = a.aircraft_id
            INNER JOIN Cities   dc  ON f.departure_city_id   = dc.city_id
            INNER JOIN Cities   ac2 ON f.destination_city_id = ac2.city_id
            LEFT  JOIN Flight_Schedules fs ON f.flight_id    = fs.flight_id
            LEFT  JOIN Bookings b          ON fs.schedule_id = b.schedule_id
            GROUP BY f.flight_id, f.flight_number, dc.city_name, ac2.city_name,
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
