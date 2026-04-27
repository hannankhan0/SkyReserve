const { getConnection, sql } = require('../config/db');


const PRICE_MULTIPLIERS = {
    first_class: 3.00,
    business: 2.00,
    economy: 1.00
};

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
        { count: economy_seats,    seat_class: 'economy' }
    ];

    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    let rowNumber = 1;
    let seatInRow = 0;

    for (const section of seatLayout) {
        let seatsLeft = section.count;

        while (seatsLeft > 0) {
            const col = columns[seatInRow % 6];
            const seatNumber = `${rowNumber}${col}`;
            const priceMultiplier = PRICE_MULTIPLIERS[section.seat_class];

            await pool.request()
                .input('schedule_id', sql.Int, scheduleId)
                .input('seat_number', sql.VarChar(5), seatNumber)
                .input('seat_class', sql.VarChar(20), section.seat_class)
                .input('is_available', sql.Bit, 1)
                .input('price_multiplier', sql.Decimal(3, 2), priceMultiplier)
                .query(`
                    INSERT INTO Seats (schedule_id, seat_number, seat_class, is_available, price_multiplier)
                    VALUES (@schedule_id, @seat_number, @seat_class, @is_available, @price_multiplier)
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