const { getConnection, sql } = require('../config/db');

// price_multiplier is no longer stored on individual Seat rows.
// It lives in Seat_Class_Prices (normalized). This generator just
// inserts seat records; the multiplier is joined at query time.

async function generateSeats(scheduleId, flightId) {
    const pool = await getConnection();

    const aircraftResult = await pool.request()
        .input('flight_id', sql.Int, flightId)
        .query(`
            SELECT
                a.aircraft_id,
                a.total_seats,
                a.economy_seats,
                a.business_seats,
                a.first_class_seats
            FROM Flights f
            JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
            WHERE f.flight_id = @flight_id
        `);

    if (!aircraftResult.recordset || aircraftResult.recordset.length === 0) {
        throw new Error('Flight or linked aircraft not found');
    }

    const aircraft = aircraftResult.recordset[0];
    const { economy_seats, business_seats, first_class_seats } = aircraft;

    const seatLayout = [
        { count: first_class_seats, seat_class: 'first_class' },
        { count: business_seats,   seat_class: 'business' },
        { count: economy_seats,    seat_class: 'economy' },
    ];

    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    let rowNumber = 1;
    let seatInRow = 0;

    for (const section of seatLayout) {
        let seatsLeft = section.count;

        while (seatsLeft > 0) {
            const col = columns[seatInRow % 6];
            const seatNumber = `${rowNumber}${col}`;

            await pool.request()
                .input('schedule_id',  sql.Int,         scheduleId)
                .input('seat_number',  sql.VarChar(5),  seatNumber)
                .input('seat_class',   sql.VarChar(20), section.seat_class)
                .input('is_available', sql.Bit,         1)
                .query(`
                    INSERT INTO Seats (schedule_id, seat_number, seat_class, is_available)
                    VALUES (@schedule_id, @seat_number, @seat_class, @is_available)
                `);

            seatInRow++;
            seatsLeft--;

            if (seatInRow % 6 === 0) {
                rowNumber++;
            }
        }

        if (seatInRow % 6 !== 0) {
            rowNumber++;
            seatInRow = 0;
        }
    }

    console.log(`Generated seats for schedule ${scheduleId} (flight ${flightId})`);
}

module.exports = { generateSeats };
