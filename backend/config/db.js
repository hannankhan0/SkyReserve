const sql = require('mssql');
require('dotenv').config();

const rawServer = process.env.DB_SERVER || 'localhost';
const [serverName, instanceFromServer] = rawServer.split('\\');
const instanceName = process.env.DB_INSTANCE || instanceFromServer || undefined;

const options = {
  encrypt: String(process.env.DB_ENCRYPT || 'false') === 'true',
  trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERT || process.env.DB_TRUST_SERVER_CERTIFICATE || 'true') === 'true',
  enableArithAbort: true,
};

if (instanceName) {
  options.instanceName = instanceName;
}

const dbConfig = {
  server: serverName,
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'SkyReserve',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (!instanceName && process.env.DB_PORT) {
  dbConfig.port = parseInt(process.env.DB_PORT, 10);
}

let pool;

async function getConnection() {
  if (!pool) {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('✅ Connected to SQL Server — SkyReserve DB');
  }
  return pool;
}

async function getPool() {
  return getConnection();
}

const poolPromise = getConnection();

module.exports = { sql, getConnection, getPool, poolPromise, dbConfig };
