// ─────────────────────────────────────────────
// INPUT VALIDATORS
// ─────────────────────────────────────────────

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^[+\d\s\-]{7,15}$/;
    return regex.test(phone);
};

const isValidDate = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

const validateRegister = (body) => {
    const errors = [];
    const { first_name, last_name, email, password_hash, phone_number, date_of_birth } = body;

    if (!first_name || first_name.trim().length < 2)
        errors.push('first_name must be at least 2 characters.');
    if (!last_name || last_name.trim().length < 2)
        errors.push('last_name must be at least 2 characters.');
    if (!email || !isValidEmail(email))
        errors.push('A valid email is required.');
    if (!password_hash || password_hash.length < 6)
        errors.push('password_hash must be at least 6 characters.');
    if (phone_number && !isValidPhone(phone_number))
        errors.push('phone_number format is invalid.');
    if (date_of_birth && !isValidDate(date_of_birth))
        errors.push('date_of_birth must be in YYYY-MM-DD format.');

    return errors;
};

const validateLogin = (body) => {
    const errors = [];
    const { email, password_hash } = body;

    if (!email || !isValidEmail(email))
        errors.push('A valid email is required.');
    if (!password_hash || password_hash.length < 1)
        errors.push('password_hash is required.');

    return errors;
};

/**
 * Validate add/update flight input.
 * Schema: Flights table stores aircraft_id (FK to Aircraft), NOT seat counts.
 * Seat counts live on the Aircraft table.
 */
const validateFlight = (body, isUpdate = false) => {
    const errors = [];
    const { flight_number, airline_name, departure_city, destination_city, aircraft_id, base_price } = body;

    if (!isUpdate) {
        if (!flight_number || flight_number.trim().length < 2)
            errors.push('flight_number is required (min 2 characters).');
        if (!airline_name || airline_name.trim().length < 2)
            errors.push('airline_name is required.');
        if (!departure_city || departure_city.trim().length < 2)
            errors.push('departure_city is required.');
        if (!destination_city || destination_city.trim().length < 2)
            errors.push('destination_city is required.');
        if (!aircraft_id || isNaN(aircraft_id) || parseInt(aircraft_id) <= 0)
            errors.push('aircraft_id is required and must be a positive integer.');
        if (!base_price || isNaN(base_price) || parseFloat(base_price) <= 0)
            errors.push('base_price is required and must be a positive number.');
    } else {
        // On update, only validate fields that were actually sent
        if (aircraft_id !== undefined && (isNaN(aircraft_id) || parseInt(aircraft_id) <= 0))
            errors.push('aircraft_id must be a positive integer.');
        if (base_price !== undefined && (isNaN(base_price) || parseFloat(base_price) <= 0))
            errors.push('base_price must be a positive number.');
    }

    return errors;
};

const validateSearchQuery = (query) => {
    const errors = [];
    const { flight_date, min_price, max_price } = query;

    if (flight_date && !isValidDate(flight_date))
        errors.push('flight_date must be in YYYY-MM-DD format.');
    if (min_price && isNaN(min_price))
        errors.push('min_price must be a number.');
    if (max_price && isNaN(max_price))
        errors.push('max_price must be a number.');
    if (min_price && max_price && parseFloat(min_price) > parseFloat(max_price))
        errors.push('min_price cannot be greater than max_price.');

    return errors;
};

module.exports = {
    validateRegister,
    validateLogin,
    validateFlight,
    validateSearchQuery,
    isValidEmail,
    isValidDate,
};