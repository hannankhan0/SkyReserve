const { sql, getPool } = require('../config/db');

const Ticket = {
  async getMyTickets(user_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('user_id', sql.Int, user_id);

    const result = await request.query(`
      SELECT 
        t.ticket_id,
        t.ticket_number,
        t.passenger_name,
        t.ticket_status,
        t.issued_at,
        s.seat_number,
        s.seat_class,
        b.booking_reference,
        b.booking_status,
        b.user_id,
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
      FROM Tickets t
      INNER JOIN Bookings b ON t.booking_id = b.booking_id
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN Seats s ON t.seat_id = s.seat_id
      WHERE b.user_id = @user_id
        AND b.booking_status IN ('confirmed', 'completed')
      ORDER BY t.issued_at DESC
    `);

    return result.recordset;
  },

  async getTicketById(ticket_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('ticket_id', sql.Int, ticket_id);

    const result = await request.query(`
      SELECT 
        t.ticket_id,
        t.ticket_number,
        t.passenger_name,
        t.ticket_status,
        t.issued_at,
        s.seat_number,
        s.seat_class,
        b.booking_reference,
        b.booking_status,
        b.user_id,
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
      FROM Tickets t
      INNER JOIN Bookings b ON t.booking_id = b.booking_id
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN Seats s ON t.seat_id = s.seat_id
      WHERE t.ticket_id = @ticket_id
    `);

    return result.recordset[0];
  },

  async checkInTicket(ticket_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('ticket_id', sql.Int, ticket_id);

    const existing = await request.query(`
      SELECT * FROM Tickets WHERE ticket_id = @ticket_id
    `);

    if (existing.recordset.length === 0) {
      throw new Error('Ticket not found');
    }

    const ticket = existing.recordset[0];

    if (ticket.ticket_status === 'cancelled') {
      throw new Error('Cancelled ticket cannot be checked in');
    }

    if (ticket.ticket_status === 'boarded') {
      throw new Error('Boarded ticket cannot be checked in again');
    }

    if (ticket.ticket_status === 'checked_in') {
      throw new Error('Ticket already checked in');
    }

    const updateRequest = pool.request();
    updateRequest.input('ticket_id', sql.Int, ticket_id);

    const result = await updateRequest.query(`
      UPDATE Tickets
      SET ticket_status = 'checked_in'
      OUTPUT INSERTED.*
      WHERE ticket_id = @ticket_id
    `);

    return result.recordset[0];
  }
};

module.exports = Ticket;
