const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
    try {
        console.log("Starting database initialization...");
        
        const connConfig = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        };

        if (
            process.env.DB_SSL === 'true' || 
            (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST) && process.env.DB_SSL !== 'false')
        ) {
            connConfig.ssl = { rejectUnauthorized: false };
        }

        // Connect to MySQL (allowing multiple statements for the schema script)
        const connection = await mysql.createConnection(connConfig);

        // Read the schema.sql file
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        console.log("Executing schema.sql...");
        await connection.query(schema);

        console.log("Database tables created successfully!");
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

initDb();
