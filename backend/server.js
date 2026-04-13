const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Flight Management System API' });
});

const scheduleRoutes = require('./routes/scheduleRoutes');
const seatRoutes = require('./routes/seatRoutes');
const aircraftRoutes = require('./routes/aircraftRoutes');

app.use('/api/schedules', scheduleRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/aircraft', aircraftRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;