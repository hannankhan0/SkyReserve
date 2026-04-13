const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

async function getConnection() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log('Database connected successfully to SkyReserve');
    }
    return pool;
}

getConnection().catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
});

module.exports = { getConnection, sql };