const express = require('express');
const router = express.Router();

const {
  createPayment,
  getMyPayments,
  getPaymentById,
  refundPayment
} = require('../controllers/paymentController');

router.post('/', createPayment);
router.get('/my-payments', getMyPayments);
router.get('/:id', getPaymentById);
router.post('/:id/refund', refundPayment);

module.exports = router;