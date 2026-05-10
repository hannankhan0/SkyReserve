const express = require('express');
const router = express.Router();
const { getAllCities } = require('../controllers/citiesController');

// Public — frontend needs this to populate dropdowns
router.get('/', getAllCities);

module.exports = router;
