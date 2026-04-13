const Payment = require('../models/Payment');

const getUserIdFromRequest = (req) => {
  return req.user?.user_id || req.body.user_id || req.headers['x-user-id'];
};

const createPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, payment_amount } = req.body;

    if (!booking_id || !payment_method || !payment_amount) {
      return res.status(400).json({
        success: false,
        message: 'booking_id, payment_method and payment_amount are required'
      });
    }

    const payment = await Payment.createPayment({
      booking_id,
      payment_method,
      payment_amount
    });

    res.status(201).json({
      success: true,
      message: 'Payment completed successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, detail: error.toString() });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const user_id = Number(getUserIdFromRequest(req));

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    const payments = await Payment.getMyPayments(user_id);

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.getPaymentById(Number(req.params.id));

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.refundPayment(Number(req.params.id));

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getPaymentById,
  refundPayment
};