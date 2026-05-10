const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', adminAuth, scheduleController.createSchedule);
router.put('/:id', adminAuth, scheduleController.updateSchedule);
router.delete('/:id', adminAuth, scheduleController.deleteSchedule);

module.exports = router;
