const express = require('express');
const router = express.Router();
const aircraftController = require('../controllers/aircraftController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', aircraftController.getAllAircraft);
router.get('/stats', adminAuth, aircraftController.getAircraftStats);
router.get('/:id', aircraftController.getAircraftById);
router.post('/', adminAuth, aircraftController.createAircraft);
router.put('/:id', adminAuth, aircraftController.updateAircraft);
router.delete('/:id', adminAuth, aircraftController.deleteAircraft);

module.exports = router;
