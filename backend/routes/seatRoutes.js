const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

router.get('/schedule/:scheduleId/map', seatController.getSeatMap);
router.get('/schedule/:scheduleId', seatController.getSeatsBySchedule);

router.post('/reserve', seatController.reserveSeats);

module.exports = router;