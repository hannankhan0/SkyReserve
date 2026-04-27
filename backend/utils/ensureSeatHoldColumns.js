const { sql } = require('../config/db');

let ensured = false;
let ensuringPromise = null;

async function ensureSeatHoldColumns(pool) {
  if (ensured) return;
  if (ensuringPromise) return ensuringPromise;

  ensuringPromise = (async () => {
    const request = pool.request();
    await request.query(`
      IF COL_LENGTH('Seats', 'held_until') IS NULL
      BEGIN
        ALTER TABLE Seats ADD held_until DATETIME2 NULL;
      END;

      IF COL_LENGTH('Seats', 'hold_user_id') IS NULL
      BEGIN
        ALTER TABLE Seats ADD hold_user_id INT NULL;
      END;
    `);
    ensured = true;
  })();

  return ensuringPromise;
}

module.exports = ensureSeatHoldColumns;
