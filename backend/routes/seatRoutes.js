const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const seatController = require('../controllers/seatController');

router.get('/schedule/:scheduleId/map', seatController.getSeatMap);
router.get('/schedule/:scheduleId', seatController.getSeatsBySchedule);
router.post('/reserve', auth, seatController.reserveSeats);

module.exports = router;
