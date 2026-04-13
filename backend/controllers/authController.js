const User = require('../models/userModel');
const { validateRegister, validateLogin } = require('../utils/validators');

// ─────────────────────────────────────────────
// FEATURE 1: USER REGISTRATION & AUTHENTICATION
// ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new passenger
 */
const register = async (req, res) => {
    try {
        // Validate input
        const errors = validateRegister(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // Check if email already taken
        const exists = await User.emailExists(req.body.email);
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        const user = await User.createUser(req.body);

        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: user
        });
    } catch (err) {
        // Catch duplicate passport number
        if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: 'Passport number already registered.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/auth/login
 * Passenger login
 */
const login = async (req, res) => {
    try {
        const errors = validateLogin(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const user = await User.findUserByCredentials(req.body);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/auth/admin-login
 * Admin login (separate from passenger)
 */
const adminLogin = async (req, res) => {
    try {
        const { username, password_hash } = req.body;

        if (!username || !password_hash) {
            return res.status(400).json({
                success: false,
                message: 'username and password_hash are required.'
            });
        }

        const admin = await User.findAdminByCredentials({ username, password_hash });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials.'
            });
        }

        res.status(200).json({
            success: true,
            message: `Welcome, ${admin.full_name}. Logged in as ${admin.role}.`,
            data: admin
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/auth/profile/:id
 * Get user profile by ID
 */
const getProfile = async (req, res) => {
    try {
        const user_id = parseInt(req.params.id);
        if (isNaN(user_id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        const user = await User.findUserById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/auth/profile/:id
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const user_id = parseInt(req.params.id);
        if (isNaN(user_id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        // Make sure user exists
        const existing = await User.findUserById(user_id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const updated = await User.updateUser(user_id, req.body);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: updated
        });
    } catch (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: 'Passport number already in use by another account.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    register,
    login,
    adminLogin,
    getProfile,
    updateProfile,
};