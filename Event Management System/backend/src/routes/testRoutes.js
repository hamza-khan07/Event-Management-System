const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

// 1. Health / Connection Test
router.get('/health', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ success: true, message: "Database connection is live & working!", result: result[0].solution });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== COMPANIES ====================
router.get('/companies', async (req, res) => {
    try {
        const [companies] = await db.query('SELECT * FROM companies');
        res.json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/companies', async (req, res) => {
    try {
        const { name, description, email, phone, address } = req.body;
        const [result] = await db.query(
            'INSERT INTO companies (name, description, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, email, phone, address]
        );
        res.status(201).json({ success: true, message: "Company created successfully", companyId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

router.get('/companies/:id/events', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events WHERE company_id = ?', [req.params.id]);
        res.json({ success: true, companyId: req.params.id, eventCount: events.length, events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== USERS ====================
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, company_id, name, email, role, status, created_at FROM users');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/users', async (req, res) => {
    try {
        const { company_id, name, email, password, role } = req.body;
        const [result] = await db.query(
            'INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [company_id || null, name, email, password, role]
        );
        res.status(201).json({ success: true, message: "User created successfully", userId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

// ==================== EVENTS ====================
router.get('/events', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events');
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/events', async (req, res) => {
    try {
        const { company_id, title, description, category, venue, event_date, start_time, end_time, capacity, status } = req.body;
        const [result] = await db.query(
            `INSERT INTO events (company_id, title, description, category, venue, event_date, start_time, end_time, capacity, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [company_id, title, description, category, venue, event_date, start_time, end_time, capacity, status || 'DRAFT']
        );
        res.status(201).json({ success: true, message: "Event created successfully", eventId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

// ==================== REGISTRATIONS ====================
router.get('/registrations', async (req, res) => {
    try {
        const [registrations] = await db.query(`
            SELECT r.*, u.name AS participant_name, u.email AS participant_email, e.title AS event_title
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            JOIN events e ON r.event_id = e.id
        `);
        res.json({ success: true, data: registrations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/registrations', async (req, res) => {
    try {
        const { user_id, event_id, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, ?)',
            [user_id, event_id, status || 'REGISTERED']
        );
        res.status(201).json({ success: true, message: "Registration successful", registrationId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

// ==================== ATTENDANCE ====================
router.get('/attendance', async (req, res) => {
    try {
        const [attendance] = await db.query(`
            SELECT a.*, r.user_id, r.event_id, u.name AS attendee_name, e.title AS event_title
            FROM attendance a
            JOIN registrations r ON a.registration_id = r.id
            JOIN users u ON r.user_id = u.id
            JOIN events e ON r.event_id = e.id
        `);
        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/attendance', async (req, res) => {
    try {
        const { registration_id, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO attendance (registration_id, status) VALUES (?, ?)',
            [registration_id, status || 'PRESENT']
        );
        res.status(201).json({ success: true, message: "Attendance marked successfully", attendanceId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

module.exports = router;
