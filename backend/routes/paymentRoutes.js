const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const {
  createPayment,
  getMyPayments,
  getPaymentById,
  refundPayment
} = require('../controllers/paymentController');

router.post('/', auth, createPayment);
router.get('/my-payments', auth, getMyPayments);
router.get('/:id', auth, getPaymentById);
router.post('/:id/refund', adminAuth, refundPayment);

module.exports = router;
