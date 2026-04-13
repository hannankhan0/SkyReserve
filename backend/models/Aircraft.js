const { getConnection, sql } = require('../config/db');


class Aircraft {
    static async create(aircraftData) {
        const {
            aircraft_type,
            manufacturer,
            model,
            total_seats,
            economy_seats,
            business_seats,
            first_class_seats,
            max_range_km,
            cruise_speed_kmh,
            fuel_capacity_liters
        } = aircraftData;

        const pool = await getConnection();
        const result = await pool.request()
            .input('aircraft_type', sql.VarChar(50), aircraft_type)
            .input('manufacturer', sql.VarChar(50), manufacturer)
            .input('model', sql.VarChar(50), model)
            .input('total_seats', sql.Int, total_seats)
            .input('economy_seats', sql.Int, economy_seats)
            .input('business_seats', sql.Int, business_seats)
            .input('first_class_seats', sql.Int, first_class_seats)
            .input('max_range_km', sql.Int, max_range_km || null)
            .input('cruise_speed_kmh', sql.Int, cruise_speed_kmh || null)
            .input('fuel_capacity_liters', sql.Int, fuel_capacity_liters || null)
            .query(`
                INSERT INTO Aircraft (
                    aircraft_type, manufacturer, model, total_seats,
                    economy_seats, business_seats, first_class_seats,
                    max_range_km, cruise_speed_kmh, fuel_capacity_liters
                )
                VALUES (
                    @aircraft_type, @manufacturer, @model, @total_seats,
                    @economy_seats, @business_seats, @first_class_seats,
                    @max_range_km, @cruise_speed_kmh, @fuel_capacity_liters
                );
                SELECT SCOPE_IDENTITY() AS aircraft_id;
            `);

        return result.recordset[0].aircraft_id;
    }

    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM Aircraft ORDER BY created_at DESC');
        return result.recordset;
    }

    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Aircraft WHERE aircraft_id = @id');
        return result.recordset[0] || null;
    }

    static async update(id, aircraftData) {
        const {
            aircraft_type,
            manufacturer,
            model,
            total_seats,
            economy_seats,
            business_seats,
            first_class_seats,
            max_range_km,
            cruise_speed_kmh,
            fuel_capacity_liters
        } = aircraftData;

        const pool = await getConnection();
        const result = await pool.request()
            .input('aircraft_type', sql.VarChar(50), aircraft_type)
            .input('manufacturer', sql.VarChar(50), manufacturer)
            .input('model', sql.VarChar(50), model)
            .input('total_seats', sql.Int, total_seats)
            .input('economy_seats', sql.Int, economy_seats)
            .input('business_seats', sql.Int, business_seats)
            .input('first_class_seats', sql.Int, first_class_seats)
            .input('max_range_km', sql.Int, max_range_km || null)
            .input('cruise_speed_kmh', sql.Int, cruise_speed_kmh || null)
            .input('fuel_capacity_liters', sql.Int, fuel_capacity_liters || null)
            .input('id', sql.Int, id)
            .query(`
                UPDATE Aircraft SET
                    aircraft_type = @aircraft_type,
                    manufacturer = @manufacturer,
                    model = @model,
                    total_seats = @total_seats,
                    economy_seats = @economy_seats,
                    business_seats = @business_seats,
                    first_class_seats = @first_class_seats,
                    max_range_km = @max_range_km,
                    cruise_speed_kmh = @cruise_speed_kmh,
                    fuel_capacity_liters = @fuel_capacity_liters
                WHERE aircraft_id = @id
            `);

        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Aircraft WHERE aircraft_id = @id');
        return result.rowsAffected[0] > 0;
    }

    static async getStats() {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT
                    a.aircraft_id,
                    a.aircraft_type,
                    a.manufacturer,
                    a.model,
                    a.total_seats,
                    COUNT(DISTINCT fs.schedule_id) AS total_scheduled_flights,
                    ISNULL(
                        AVG(
                            CAST(
                                (a.total_seats - fs.available_seats) AS FLOAT
                            ) * 100.0 / NULLIF(a.total_seats, 0)
                        ), 0
                    ) AS avg_occupancy_rate,
                    ISNULL(SUM(b.total_amount), 0) AS total_revenue
                FROM Aircraft a
                LEFT JOIN Flights f ON a.aircraft_id = f.aircraft_id
                LEFT JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
                LEFT JOIN Bookings b ON fs.schedule_id = b.schedule_id
                    AND b.booking_status IN ('confirmed', 'completed')
                GROUP BY
                    a.aircraft_id, a.aircraft_type, a.manufacturer,
                    a.model, a.total_seats
                ORDER BY total_revenue DESC
            `);

        return result.recordset;
    }
}

module.exports = Aircraft;