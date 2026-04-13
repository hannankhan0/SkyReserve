const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const authRoutes   = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/flights', flightRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '  SkyReserve API — Member 1 (Auth + Flights)',
        features: [
            'Feature 1: User Registration & Authentication → /api/auth',
            'Feature 2: Flight Management (Admin)          → /api/flights',
            'Feature 3: Flight Search                      → /api/flights/search',
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`   SkyReserve server running on http://localhost:${PORT}`);
    console.log(`   Auth routes   → http://localhost:${PORT}/api/auth`);
    console.log(`   Flight routes → http://localhost:${PORT}/api/flights`);
});