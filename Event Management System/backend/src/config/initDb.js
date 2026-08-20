const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
    try {
        console.log("Starting database initialization...");
        
        // Connect to MySQL (allowing multiple statements for the schema script)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true // Required to run multiple queries in one go
        });

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
