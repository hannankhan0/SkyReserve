const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ─────────────────────────────────────────────
// FEATURE 1: AUTH ROUTES
// Base: /api/auth
// ─────────────────────────────────────────────

// POST /api/auth/register       — Create new passenger account
router.post('/register', authController.register);

// POST /api/auth/login          — Passenger login
router.post('/login', authController.login);

// POST /api/auth/admin-login    — Admin login (separate)
router.post('/admin-login', authController.adminLogin);

// GET  /api/auth/profile/:id    — View user profile
router.get('/profile/:id', authController.getProfile);

// PUT  /api/auth/profile/:id    — Update user profile
router.put('/profile/:id', authController.updateProfile);

module.exports = router;