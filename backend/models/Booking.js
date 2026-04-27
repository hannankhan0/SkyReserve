const { sql, getPool } = require('../config/db');
const ensureSeatHoldColumns = require('../utils/ensureSeatHoldColumns');


const generateTicketNumber = (bookingId, index) => {
  // Keep <= 15 characters because some existing lab databases still have
  // Tickets.ticket_number as VARCHAR(15). This avoids SQL truncation errors.
  const timePart = Date.now().toString().slice(-6);
  const raw = `T${bookingId}${index + 1}${timePart}`;
  return raw.slice(0, 15);
};

const generateBookingReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'SKR';
  for (let i = 0; i < 7; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

const Booking = {
  async createBooking({ user_id, schedule_id, passengers, special_requests }) {
    const pool = await getPool();
    await ensureSeatHoldColumns(pool);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const passengerCount = passengers.length;

      const scheduleRequest = new sql.Request(transaction);
      scheduleRequest.input('schedule_id', sql.Int, schedule_id);

      const scheduleResult = await scheduleRequest.query(`
        SELECT 
          fs.schedule_id,
          fs.status,
          fs.available_seats,
          f.base_price,
          f.flight_number,
          f.airline_name,
          f.departure_city,
          f.destination_city,
          a.aircraft_type,
          a.manufacturer,
          a.model
        FROM Flight_Schedules fs
        INNER JOIN Flights f ON fs.flight_id = f.flight_id
        INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
        WHERE fs.schedule_id = @schedule_id
      `);

      if (scheduleResult.recordset.length === 0) {
        throw new Error('Schedule not found');
      }

      const schedule = scheduleResult.recordset[0];

      if (schedule.status === 'cancelled') {
        throw new Error('Cannot book a cancelled flight');
      }

      if (schedule.available_seats < passengerCount) {
        throw new Error('Not enough available seats');
      }

      const seatIds = passengers.map((p) => p.seat_id);

      if (seatIds.length !== passengerCount) {
        throw new Error('Each passenger must have a seat_id');
      }

      const seatRequest = new sql.Request(transaction);
      seatRequest.input('schedule_id', sql.Int, schedule_id);

      const seatPlaceholders = seatIds.map((_, index) => `@seat${index}`).join(', ');

      seatIds.forEach((seatId, index) => {
        seatRequest.input(`seat${index}`, sql.Int, seatId);
      });

      const seatResult = await seatRequest.query(`
        SELECT seat_id, seat_number, seat_class, is_available, price_multiplier, held_until, hold_user_id
        FROM Seats
        WHERE schedule_id = @schedule_id
          AND seat_id IN (${seatPlaceholders})
      `);

      if (seatResult.recordset.length !== passengerCount) {
        throw new Error('One or more seats do not belong to this schedule');
      }

      const unavailableSeat = seatResult.recordset.find((seat) => {
        const isAvailable = seat.is_available === true || seat.is_available === 1;
        const hasValidHold = seat.held_until && new Date(seat.held_until) > new Date() &&
          (seat.hold_user_id == null || Number(seat.hold_user_id) === Number(user_id));
        return !isAvailable && !hasValidHold;
      });

      if (unavailableSeat) {
        throw new Error(`Seat ${unavailableSeat.seat_number} is not available`);
      }

      const totalAmount = seatResult.recordset.reduce((sum, seat) => {
        return sum + Number(schedule.base_price) * Number(seat.price_multiplier);
      }, 0);

      const bookingReference = generateBookingReference();

      const insertBookingRequest = new sql.Request(transaction);
      insertBookingRequest.input('user_id', sql.Int, user_id);
      insertBookingRequest.input('schedule_id', sql.Int, schedule_id);
      insertBookingRequest.input('booking_reference', sql.VarChar(10), bookingReference);
      insertBookingRequest.input('total_passengers', sql.Int, passengerCount);
      insertBookingRequest.input('total_amount', sql.Decimal(10, 2), totalAmount);
      insertBookingRequest.input(
        'special_requests',
        sql.VarChar(sql.MAX),
        special_requests || null
      );

      const bookingInsertResult = await insertBookingRequest.query(`
        INSERT INTO Bookings (
          user_id, schedule_id, booking_reference, total_passengers, total_amount, special_requests
        )
        OUTPUT INSERTED.*
        VALUES (
          @user_id, @schedule_id, @booking_reference, @total_passengers, @total_amount, @special_requests
        )
      `);

      const booking = bookingInsertResult.recordset[0];

      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        const ticketNumber = generateTicketNumber(booking.booking_id, i);

        const ticketRequest = new sql.Request(transaction);
        ticketRequest.input('booking_id', sql.Int, booking.booking_id);
        ticketRequest.input('seat_id', sql.Int, passenger.seat_id);
        ticketRequest.input('passenger_name', sql.VarChar(100), passenger.passenger_name);
        ticketRequest.input('ticket_number', sql.VarChar(50), ticketNumber);

        await ticketRequest.query(`
          INSERT INTO Tickets (booking_id, seat_id, passenger_name, ticket_number)
          VALUES (@booking_id, @seat_id, @passenger_name, @ticket_number)
        `);
      }

      const updateSeatsRequest = new sql.Request(transaction);
      seatIds.forEach((seatId, index) => {
        updateSeatsRequest.input(`seatUpdate${index}`, sql.Int, seatId);
      });

      const seatUpdatePlaceholders = seatIds
        .map((_, index) => `@seatUpdate${index}`)
        .join(', ');

      await updateSeatsRequest.query(`
        UPDATE Seats
        SET is_available = 0,
            held_until = NULL,
            hold_user_id = NULL
        WHERE seat_id IN (${seatUpdatePlaceholders})
      `);

      const updateScheduleRequest = new sql.Request(transaction);
      updateScheduleRequest.input('schedule_id', sql.Int, schedule_id);
      updateScheduleRequest.input('passengerCount', sql.Int, passengerCount);

      await updateScheduleRequest.query(`
        UPDATE Flight_Schedules
        SET available_seats = available_seats - @passengerCount
        WHERE schedule_id = @schedule_id
      `);

      await transaction.commit();

      return {
        booking,
        total_amount: totalAmount,
        flight: {
          flight_number: schedule.flight_number,
          airline_name: schedule.airline_name,
          departure_city: schedule.departure_city,
          destination_city: schedule.destination_city,
          aircraft_type: schedule.aircraft_type,
          manufacturer: schedule.manufacturer,
          model: schedule.model
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getMyBookings(user_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('user_id', sql.Int, user_id);

    const result = await request.query(`
      SELECT 
        b.booking_id,
        b.booking_reference,
        b.booking_date,
        b.total_passengers,
        b.total_amount,
        b.booking_status,
        b.special_requests,
        f.flight_number,
        f.airline_name,
        f.departure_city,
        f.destination_city,
        a.aircraft_type,
        a.manufacturer,
        a.model,
        fs.flight_date,
        fs.departure_time,
        fs.arrival_time
      FROM Bookings b
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
      WHERE b.user_id = @user_id
      ORDER BY b.booking_date DESC
    `);

    return result.recordset;
  },

  async getBookingById(booking_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('booking_id', sql.Int, booking_id);

    const result = await request.query(`
      SELECT 
        b.*,
        f.flight_number,
        f.airline_name,
        f.departure_city,
        f.destination_city,
        a.aircraft_type,
        a.manufacturer,
        a.model,
        fs.flight_date,
        fs.departure_time,
        fs.arrival_time,
        fs.status AS schedule_status
      FROM Bookings b
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
      WHERE b.booking_id = @booking_id
    `);

    return result.recordset[0];
  },

  async confirmBooking(booking_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('booking_id', sql.Int, booking_id);

    const result = await request.query(`
      UPDATE Bookings
      SET booking_status = 'confirmed'
      OUTPUT INSERTED.*
      WHERE booking_id = @booking_id
    `);

    return result.recordset[0];
  },

  async cancelBooking(booking_id) {
    const pool = await getPool();
    await ensureSeatHoldColumns(pool);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const bookingRequest = new sql.Request(transaction);
      bookingRequest.input('booking_id', sql.Int, booking_id);

      const bookingResult = await bookingRequest.query(`
        SELECT * FROM Bookings WHERE booking_id = @booking_id
      `);

      if (bookingResult.recordset.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = bookingResult.recordset[0];

      if (booking.booking_status === 'cancelled') {
        throw new Error('Booking already cancelled');
      }

      const seatCountRequest = new sql.Request(transaction);
      seatCountRequest.input('booking_id', sql.Int, booking_id);

      const seatCountResult = await seatCountRequest.query(`
        SELECT COUNT(*) AS seat_count
        FROM Tickets
        WHERE booking_id = @booking_id AND seat_id IS NOT NULL
      `);

      const seatCount = seatCountResult.recordset[0].seat_count;

      const cancelBookingRequest = new sql.Request(transaction);
      cancelBookingRequest.input('booking_id', sql.Int, booking_id);

      await cancelBookingRequest.query(`
        UPDATE Bookings
        SET booking_status = 'cancelled'
        WHERE booking_id = @booking_id
      `);

      const cancelTicketsRequest = new sql.Request(transaction);
      cancelTicketsRequest.input('booking_id', sql.Int, booking_id);

      await cancelTicketsRequest.query(`
        UPDATE Tickets
        SET ticket_status = 'cancelled'
        WHERE booking_id = @booking_id
      `);

      const releaseSeatsRequest = new sql.Request(transaction);
      releaseSeatsRequest.input('booking_id', sql.Int, booking_id);

      await releaseSeatsRequest.query(`
        UPDATE Seats
        SET is_available = 1,
            held_until = NULL,
            hold_user_id = NULL
        WHERE seat_id IN (
          SELECT seat_id
          FROM Tickets
          WHERE booking_id = @booking_id
            AND seat_id IS NOT NULL
        )
      `);

      const refundPaymentRequest = new sql.Request(transaction);
      refundPaymentRequest.input('booking_id', sql.Int, booking_id);

      await refundPaymentRequest.query(`
        UPDATE Payments
        SET payment_status = 'refunded'
        WHERE booking_id = @booking_id
      `);

      const updateScheduleRequest = new sql.Request(transaction);
      updateScheduleRequest.input('schedule_id', sql.Int, booking.schedule_id);
      updateScheduleRequest.input('seat_count', sql.Int, seatCount);

      await updateScheduleRequest.query(`
        UPDATE Flight_Schedules
        SET available_seats = available_seats + @seat_count
        WHERE schedule_id = @schedule_id
      `);

      await transaction.commit();

      return { message: 'Booking cancelled successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getAllBookings() {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        b.booking_id,
        b.booking_reference,
        b.booking_date,
        b.total_passengers,
        b.total_amount,
        b.booking_status,
        u.first_name,
        u.last_name,
        u.email,
        f.flight_number,
        f.airline_name,
        f.departure_city,
        f.destination_city,
        a.aircraft_type,
        a.manufacturer,
        a.model,
        fs.flight_date
      FROM Bookings b
      INNER JOIN Users u ON b.user_id = u.user_id
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
      ORDER BY b.booking_date DESC
    `);

    return result.recordset;
  },

  async getBookingStats() {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        booking_status,
        COUNT(*) AS total_bookings,
        SUM(total_passengers) AS total_passengers,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_booking_value
      FROM Bookings
      GROUP BY booking_status
      ORDER BY total_bookings DESC
    `);

    return result.recordset;
  }
};

module.exports = Booking;