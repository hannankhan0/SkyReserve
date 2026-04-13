require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    },
};

(async () => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        console.log('Database:', process.env.DB_NAME);
        for (const row of r.recordset) {
            console.log(`${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
        }
        await pool.close();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
