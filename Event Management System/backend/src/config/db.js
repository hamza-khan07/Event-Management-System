const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './../.env') });

// Create connection pool with promise support for async/await
// dateStrings: ['DATE'] ensures DATE columns (event_date, registration_deadline) are
// returned as raw 'YYYY-MM-DD' strings, preventing UTC timezone offset shifting.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: ['DATE']
});

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


