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
    const pool = await sql.connect(config);
    const r = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Flights'
        ORDER BY ORDINAL_POSITION
    `);
    console.log('Flights columns:');
    for (const row of r.recordset) {
        console.log(`  ${row.COLUMN_NAME} ${row.DATA_TYPE} null=${row.IS_NULLABLE}`);
    }
    await pool.close();
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
