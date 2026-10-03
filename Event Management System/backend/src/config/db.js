const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './../.env') });

// Create connection pool with promise support for async/await
// dateStrings: ['DATE'] ensures DATE columns (event_date, registration_deadline) are
// returned as raw 'YYYY-MM-DD' strings, preventing UTC timezone offset shifting.
const poolConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: ['DATE']
};

// Enable SSL for cloud MySQL providers (Aiven, TiDB, Railway) when host is not localhost
if (
    process.env.DB_SSL === 'true' || 
    (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST) && process.env.DB_SSL !== 'false')
) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

const db = pool.promise();

// Initial connection test
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database Connection Failed:", err.message);
        return;
    } console.log("MySQL Database Connected Successfully!");
    connection.release();
});

module.exports = db;


