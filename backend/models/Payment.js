const { sql, getPool } = require('../config/db');

const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

const Payment = {
  async createPayment({ booking_id, payment_method, payment_amount }) {
    const pool = await getPool();
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
        throw new Error('Cannot pay for a cancelled booking');
      }

      const transactionId = generateTransactionId();

      const paymentRequest = new sql.Request(transaction);
      paymentRequest.input('booking_id', sql.Int, booking_id);
      paymentRequest.input('payment_method', sql.VarChar(20), payment_method);
      paymentRequest.input('payment_amount', sql.Decimal(10, 2), payment_amount);
      paymentRequest.input('transaction_id', sql.VarChar(50), transactionId);

      const paymentResult = await paymentRequest.query(`
        INSERT INTO Payments (
          booking_id, payment_method, payment_amount, payment_status, transaction_id
        )
        OUTPUT INSERTED.*
        VALUES (
          @booking_id, @payment_method, @payment_amount, 'completed', @transaction_id
        )
      `);

      const confirmRequest = new sql.Request(transaction);
      confirmRequest.input('booking_id', sql.Int, booking_id);

      await confirmRequest.query(`
        UPDATE Bookings
        SET booking_status = 'confirmed'
        WHERE booking_id = @booking_id
      `);

      await transaction.commit();

      return paymentResult.recordset[0];
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getMyPayments(user_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('user_id', sql.Int, user_id);

    const result = await request.query(`
      SELECT 
        p.payment_id,
        p.payment_method,
        p.payment_amount,
        p.payment_status,
        p.transaction_id,
        p.payment_date,
        b.booking_reference,
        f.flight_number
      FROM Payments p
      INNER JOIN Bookings b ON p.booking_id = b.booking_id
      INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
      INNER JOIN Flights f ON fs.flight_id = f.flight_id
      WHERE b.user_id = @user_id
      ORDER BY p.payment_date DESC
    `);

    return result.recordset;
  },

  async getPaymentById(payment_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('payment_id', sql.Int, payment_id);

    const result = await request.query(`
      SELECT 
        p.*,
        b.booking_reference,
        b.booking_status
      FROM Payments p
      INNER JOIN Bookings b ON p.booking_id = b.booking_id
      WHERE p.payment_id = @payment_id
    `);

    return result.recordset[0];
  },

  async refundPayment(payment_id) {
    const pool = await getPool();
    const request = pool.request();
    request.input('payment_id', sql.Int, payment_id);

    const existingResult = await request.query(`
      SELECT * FROM Payments WHERE payment_id = @payment_id
    `);

    if (existingResult.recordset.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = existingResult.recordset[0];

    if (payment.payment_status === 'refunded') {
      throw new Error('Payment already refunded');
    }

    const updateRequest = pool.request();
    updateRequest.input('payment_id', sql.Int, payment_id);

    const result = await updateRequest.query(`
      UPDATE Payments
      SET payment_status = 'refunded'
      OUTPUT INSERTED.*
      WHERE payment_id = @payment_id
    `);

    return result.recordset[0];
  }
};

module.exports = Payment;