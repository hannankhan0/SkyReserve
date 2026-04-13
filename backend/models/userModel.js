const { sql, poolPromise } = require('../config/db');

// ─────────────────────────────────────────────
// FEATURE 1: USER REGISTRATION & AUTHENTICATION
// ─────────────────────────────────────────────

/**
 * Register a new user
 */
const createUser = async ({ first_name, last_name, email, password_hash, phone_number, date_of_birth, passport_number }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('first_name',      sql.VarChar(50),  first_name)
        .input('last_name',       sql.VarChar(50),  last_name)
        .input('email',           sql.VarChar(100), email)
        .input('password_hash',   sql.VarChar(255), password_hash)
        .input('phone_number',    sql.VarChar(15),  phone_number    || null)
        .input('date_of_birth',   sql.Date,         date_of_birth   || null)
        .input('passport_number', sql.VarChar(20),  passport_number || null)
        .query(`
            INSERT INTO Users 
                (first_name, last_name, email, password_hash, phone_number, date_of_birth, passport_number)
            OUTPUT 
                INSERTED.user_id,
                INSERTED.first_name,
                INSERTED.last_name,
                INSERTED.email,
                INSERTED.phone_number,
                INSERTED.date_of_birth,
                INSERTED.passport_number,
                INSERTED.created_at
            VALUES 
                (@first_name, @last_name, @email, @password_hash, @phone_number, @date_of_birth, @passport_number)
        `);
    return result.recordset[0];
};

/**
 * Find user by email and password (login)
 */
const findUserByCredentials = async ({ email, password_hash }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email',         sql.VarChar(100), email)
        .input('password_hash', sql.VarChar(255), password_hash)
        .query(`
            SELECT user_id, first_name, last_name, email, phone_number, passport_number
            FROM Users
            WHERE email = @email AND password_hash = @password_hash
        `);
    return result.recordset[0];
};

/**
 * Find admin by username and password (admin login)
 */
const findAdminByCredentials = async ({ username, password_hash }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('username',      sql.VarChar(50),  username)
        .input('password_hash', sql.VarChar(255), password_hash)
        .query(`
            SELECT admin_id, username, full_name, email, role
            FROM Admin
            WHERE username = @username AND password_hash = @password_hash
        `);
    return result.recordset[0];
};

/**
 * Get user profile by ID
 */
const findUserById = async (user_id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('user_id', sql.Int, user_id)
        .query(`
            SELECT 
                user_id, first_name, last_name, email,
                phone_number, date_of_birth, passport_number, created_at
            FROM Users
            WHERE user_id = @user_id
        `);
    return result.recordset[0];
};

/**
 * Update user profile
 */
const updateUser = async (user_id, { first_name, last_name, phone_number, date_of_birth, passport_number }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('user_id',         sql.Int,         user_id)
        .input('first_name',      sql.VarChar(50), first_name      || null)
        .input('last_name',       sql.VarChar(50), last_name       || null)
        .input('phone_number',    sql.VarChar(15), phone_number    || null)
        .input('date_of_birth',   sql.Date,        date_of_birth   || null)
        .input('passport_number', sql.VarChar(20), passport_number || null)
        .query(`
            UPDATE Users
            SET
                first_name      = COALESCE(@first_name,      first_name),
                last_name       = COALESCE(@last_name,       last_name),
                phone_number    = COALESCE(@phone_number,    phone_number),
                date_of_birth   = COALESCE(@date_of_birth,   date_of_birth),
                passport_number = COALESCE(@passport_number, passport_number)
            OUTPUT
                INSERTED.user_id,
                INSERTED.first_name,
                INSERTED.last_name,
                INSERTED.email,
                INSERTED.phone_number,
                INSERTED.date_of_birth,
                INSERTED.passport_number
            WHERE user_id = @user_id
        `);
    return result.recordset[0];
};

/**
 * Check if email already exists
 */
const emailExists = async (email) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email', sql.VarChar(100), email)
        .query(`SELECT COUNT(*) AS count FROM Users WHERE email = @email`);
    return result.recordset[0].count > 0;
};

module.exports = {
    createUser,
    findUserByCredentials,
    findAdminByCredentials,
    findUserById,
    updateUser,
    emailExists,
};