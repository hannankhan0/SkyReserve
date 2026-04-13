const { getConnection, sql } = require('../config/db');


class Schedule {
    static async create(scheduleData) {
        const {
            flight_id,
            departure_time,
            arrival_time,
            flight_date,
            status,
            gate_number,
            available_seats
        } = scheduleData;

        const pool = await getConnection();
        const result = await pool.request()
            .input('flight_id', sql.Int, flight_id)
            .input('departure_time', sql.DateTime, new Date(departure_time))
            .input('arrival_time', sql.DateTime, new Date(arrival_time))
            .input('flight_date', sql.Date, new Date(flight_date))
            .input('status', sql.VarChar(20), status || 'on_time')
            .input('gate_number', sql.VarChar(10), gate_number || null)
            .input('available_seats', sql.Int, available_seats)
            .query(`
                INSERT INTO Flight_Schedules (
                    flight_id, departure_time, arrival_time,
                    flight_date, status, gate_number, available_seats
                )
                VALUES (
                    @flight_id, @departure_time, @arrival_time,
                    @flight_date, @status, @gate_number, @available_seats
                );
                SELECT SCOPE_IDENTITY() AS schedule_id;
            `);

        return result.recordset[0].schedule_id;
    }

    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT
                    fs.*,
                    f.flight_number,
                    f.airline_name,
                    f.departure_city,
                    f.destination_city,
                    f.base_price,
                    a.aircraft_type,
                    a.model AS aircraft_model,
                    a.total_seats
                FROM Flight_Schedules fs
                JOIN Flights f ON fs.flight_id = f.flight_id
                LEFT JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
                ORDER BY fs.flight_date DESC, fs.departure_time DESC
            `);

        return result.recordset;
    }

    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    fs.*,
                    f.flight_number,
                    f.airline_name,
                    f.departure_city,
                    f.destination_city,
                    f.base_price,
                    a.aircraft_id,
                    a.aircraft_type,
                    a.model AS aircraft_model,
                    a.total_seats,
                    a.economy_seats,
                    a.business_seats,
                    a.first_class_seats,
                    (SELECT COUNT(*) FROM Seats s
                     WHERE s.schedule_id = fs.schedule_id AND s.is_available = 1) AS seats_available_count
                FROM Flight_Schedules fs
                JOIN Flights f ON fs.flight_id = f.flight_id
                LEFT JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
                WHERE fs.schedule_id = @id
            `);

        return result.recordset[0] || null;
    }

    static async update(id, scheduleData) {
        const {
            departure_time,
            arrival_time,
            flight_date,
            status,
            gate_number,
            available_seats
        } = scheduleData;

        const pool = await getConnection();
        const result = await pool.request()
            .input('departure_time', sql.DateTime, departure_time ? new Date(departure_time) : null)
            .input('arrival_time', sql.DateTime, arrival_time ? new Date(arrival_time) : null)
            .input('flight_date', sql.Date, flight_date ? new Date(flight_date) : null)
            .input('status', sql.VarChar(20), status || null)
            .input('gate_number', sql.VarChar(10), gate_number !== undefined ? gate_number : null)
            .input('available_seats', sql.Int, available_seats !== undefined ? available_seats : null)
            .input('id', sql.Int, id)
            .query(`
                UPDATE Flight_Schedules SET
                    departure_time  = COALESCE(@departure_time,  departure_time),
                    arrival_time    = COALESCE(@arrival_time,    arrival_time),
                    flight_date     = COALESCE(@flight_date,     flight_date),
                    status          = COALESCE(@status,          status),
                    gate_number     = COALESCE(@gate_number,     gate_number),
                    available_seats = COALESCE(@available_seats, available_seats)
                WHERE schedule_id = @id
            `);

        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Flight_Schedules WHERE schedule_id = @id');
        return result.rowsAffected[0] > 0;
    }
}

module.exports = Schedule;