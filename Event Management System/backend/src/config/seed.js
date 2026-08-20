const db = require('./db.js');

async function seedData() {
    try {
        console.log("Starting Database Seeding...");

        // 1. Insert 1 Company
        const [companyResult] = await db.query(`
            INSERT INTO companies (name, description, email, phone, address, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['TechSphere Solutions', 'Enterprise Software & Events Hub', 'contact@techsphere.fake', '+92-300-1234567', '45 Innovation Way, Tech Park', 'ACTIVE']);
        const companyId = companyResult.insertId;
        console.log(`1. Company created with ID: ${companyId}`);

        // 2. Insert 1 Product Manager (company_id: NULL)
        const [pmResult] = await db.query(`
            INSERT INTO users (company_id, name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [null, 'Ali Khan', 'ali.pm@fake.com', 'hashed_pass_123', 'PRODUCT_MANAGER', 'ACTIVE']);
        console.log(`2. Product Manager created with ID: ${pmResult.insertId}`);

        // 3. Insert 1 Organizer (belonging to Company 1)
        const [organizerResult] = await db.query(`
            INSERT INTO users (company_id, name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [companyId, 'Sara Ahmed', 'sara.organizer@fake.com', 'hashed_pass_123', 'ORGANIZER', 'ACTIVE']);
        console.log(`3. Organizer created with ID: ${organizerResult.insertId} (Company ID: ${companyId})`);

        // 4. Insert 1 Participant
        const [participantResult] = await db.query(`
            INSERT INTO users (company_id, name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [null, 'Ahmed Ali', 'ahmed.participant@fake.com', 'hashed_pass_123', 'PARTICIPANT', 'ACTIVE']);
        const participantId = participantResult.insertId;
        console.log(`4. Participant created with ID: ${participantId}`);

        // 5. Insert 1 Event (belonging to Company 1)
        const [eventResult] = await db.query(`
            INSERT INTO events (company_id, title, description, category, venue, event_date, start_time, end_time, capacity, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [companyId, 'AI & Cloud Summit 2026', 'Annual Technology and Innovation Conference', 'Technology', 'Grand Hall A, Expo Center', '2026-09-15', '09:00:00', '17:00:00', 100, 'PUBLISHED']);
        const eventId = eventResult.insertId;
        console.log(`5. Event created with ID: ${eventId} (Company ID: ${companyId})`);

        // 6. Insert 1 Registration for Participant -> Event
        const [regResult] = await db.query(`
            INSERT INTO registrations (user_id, event_id, status)
            VALUES (?, ?, ?)
        `, [participantId, eventId, 'REGISTERED']);
        const registrationId = regResult.insertId;
        console.log(`6. Registration created with ID: ${registrationId}`);

        // 7. Insert 1 Attendance Record
        const [attResult] = await db.query(`
            INSERT INTO attendance (registration_id, status)
            VALUES (?, ?)
        `, [registrationId, 'PRESENT']);
        console.log(`7. Attendance record created with ID: ${attResult.insertId} (Registration ID: ${registrationId})`);

        console.log("\n Seed Data Populated Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error.message);
        process.exit(1);
    }
}

seedData();
