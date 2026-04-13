const express = require('express');
const router = express.Router();
const aircraftController = require('../controllers/aircraftController');

router.get('/stats', aircraftController.getAircraftStats);
router.get('/', aircraftController.getAllAircraft);
router.get('/:id', aircraftController.getAircraftById);

router.post('/', aircraftController.createAircraft);
router.put('/:id', aircraftController.updateAircraft);
router.delete('/:id', aircraftController.deleteAircraft);

module.exports = router;