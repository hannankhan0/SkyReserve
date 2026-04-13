const { getConnection, sql } = require('../config/db');


class Seat {

    static async findBySchedule(scheduleId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('schedule_id', sql.Int, scheduleId)
            .query(`
                SELECT
                    s.seat_id,
                    s.schedule_id,
                    s.seat_number,
                    s.seat_class,
                    s.is_available,
                    s.price_multiplier,
                    s.held_until,
                    s.hold_user_id,
                    f.base_price,
                    CAST(f.base_price * s.price_multiplier AS DECIMAL(10,2)) AS seat_price
                FROM Seats s
                JOIN Flight_Schedules fs ON s.schedule_id = fs.schedule_id
                JOIN Flights f ON fs.flight_id = f.flight_id
                WHERE s.schedule_id = @schedule_id
                ORDER BY s.seat_number
            `);
        return result.recordset;
    }

    static async getSeatMap(scheduleId) {
        const pool = await getConnection();

        await pool.request()
            .input('schedule_id', sql.Int, scheduleId)
            .query(`
                UPDATE Seats
                SET is_available = 1, held_until = NULL, hold_user_id = NULL
                WHERE schedule_id = @schedule_id
                  AND is_available = 0
                  AND held_until IS NOT NULL
                  AND held_until < GETDATE()
            `);

        const result = await pool.request()
            .input('schedule_id', sql.Int, scheduleId)
            .query(`
                SELECT
                    s.seat_id,
                    s.seat_number,
                    s.seat_class,
                    s.is_available,
                    CASE
                        WHEN s.is_available = 0 AND s.held_until IS NOT NULL THEN 'held'
                        WHEN s.is_available = 0 THEN 'booked'
                        ELSE 'available'
                    END AS seat_status,
                    s.price_multiplier,
                    CAST(f.base_price * s.price_multiplier AS DECIMAL(10,2)) AS seat_price
                FROM Seats s
                JOIN Flight_Schedules fs ON s.schedule_id = fs.schedule_id
                JOIN Flights f ON fs.flight_id = f.flight_id
                WHERE s.schedule_id = @schedule_id
                ORDER BY s.seat_number
            `);
        return result.recordset;
    }


    static async reserve(seatIds, userId) {
        const pool = await getConnection();

        const request = pool.request();
        const placeholders = seatIds.map((id, index) => {
            request.input(`id${index}`, sql.Int, id);
            return `@id${index}`;
        }).join(', ');

        const checkResult = await request.query(`
            SELECT seat_id FROM Seats
            WHERE seat_id IN (${placeholders}) AND is_available = 1
        `);

        if (checkResult.recordset.length !== seatIds.length) {
            const availableIds = checkResult.recordset.map(r => r.seat_id);
            const unavailable = seatIds.filter(id => !availableIds.includes(id));
            throw new Error(`Seats not available: ${unavailable.join(', ')}`);
        }

        const holdUntil = new Date(Date.now() + 10 * 60 * 1000);

        const updateRequest = pool.request();
        updateRequest.input('held_until', sql.DateTime2, holdUntil);
        updateRequest.input('hold_user_id', sql.Int, userId || null);

        seatIds.forEach((id, index) => {
            updateRequest.input(`uid${index}`, sql.Int, id);
        });

        const updatePlaceholders = seatIds.map((_, i) => `@uid${i}`).join(', ');

        const updateResult = await updateRequest.query(`
            UPDATE Seats
            SET is_available = 0,
                held_until = @held_until,
                hold_user_id = @hold_user_id
            WHERE seat_id IN (${updatePlaceholders}) AND is_available = 1
        `);

        return updateResult.rowsAffected[0];
    }

    static async book(seatIds) {
        const pool = await getConnection();
        const request = pool.request();

        seatIds.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        const placeholders = seatIds.map((_, i) => `@id${i}`).join(', ');

        const result = await request.query(`
            UPDATE Seats
            SET is_available = 0,
                held_until = NULL,
                hold_user_id = NULL
            WHERE seat_id IN (${placeholders})
        `);

        return result.rowsAffected[0];
    }

    static async release(seatIds) {
        const pool = await getConnection();
        const request = pool.request();

        seatIds.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        const placeholders = seatIds.map((_, i) => `@id${i}`).join(', ');

        const result = await request.query(`
            UPDATE Seats
            SET is_available = 1,
                held_until = NULL,
                hold_user_id = NULL
            WHERE seat_id IN (${placeholders})
        `);

        return result.rowsAffected[0];
    }
}

module.exports = Seat;