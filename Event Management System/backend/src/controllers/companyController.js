// backend/src/controllers/companyController.js
const db = require('../config/db');

// ─────────────────────────────────────────────
// 1. GET ALL COMPANIES (with Search + Pagination)
// ─────────────────────────────────────────────
// Kyun: PM ko saari companies ek table mein dekhni hain.
// Search aur pagination isliye ke data zyada hone par bhi
// page hang na ho (performance best practice).
const getAllCompanies = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        // Flexible query: search hoga to WHERE clause lagega, nahi to nahi lagega
        let query = 'SELECT * FROM companies WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM companies WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            countQuery += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        const [companies] = await db.query(query, [...params, limit, offset]);
        const [countRows] = await db.query(countQuery, params);

        res.status(200).json({
            success: true,
            data: companies,
            pagination: {
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// 2. GET SINGLE COMPANY (with its Organizers)
// ─────────────────────────────────────────────
// Kyun: PM kisi ek company par click kare to uski poori
// details aur us se linked organizers dikhayi jayein (JOIN query).
const getCompanyById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Company ki basic detail
        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
        if (companies.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // 2. Us company se linked organizers
        const [organizers] = await db.query(
            `SELECT u.id, u.name, u.email, u.status 
             FROM users u 
             WHERE u.company_id = ? AND u.role = 'ORGANIZER'`,
            [id]
        );

        // 3. [NEW] Us company ke total events ka count
        // COUNT(*) ek aggregate function hai jo rows ki ginti karta hai
        const [eventCount] = await db.query(
            `SELECT COUNT(*) as total FROM events WHERE company_id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...companies[0],
                organizers,
                totalEvents: eventCount[0].total  // [NEW] Event count add kiya
            }
        });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────
// 3. UPDATE COMPANY STATUS (Activate / Suspend)
// ─────────────────────────────────────────────
// Kyun: PM chahta hai ke kisi company ko bina delete kiye
// temporarily band kar sake. Yeh "Soft Control" hai.
const updateCompanyStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACTIVE' ya 'SUSPENDED'

        // Validation will be handled by Zod Middleware

        await db.query('UPDATE companies SET status = ? WHERE id = ?', [status, id]);

        res.status(200).json({
            success: true,
            message: `Company ${status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'} successfully`
        });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────
// 4. CREATE COMPANY
// ─────────────────────────────────────────────
const createCompany = async (req, res, next) => {
    try {
        const { name, description, email, phone, address } = req.body;
        // Manual validation replaced by Zod

        const [result] = await db.query(
            'INSERT INTO companies (name, description, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), description || null, email ? email.trim() : null, phone || null, address || null, 'ACTIVE']
        );

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: { id: result.insertId, name: name.trim(), description: description || null, email: email ? email.trim() : null, phone: phone || null, address: address || null, status: 'ACTIVE' }
        });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────
// 5. UPDATE COMPANY INFO (name, email, phone, description, address)
// ─────────────────────────────────────────────
// Kyun: PM company ki info galat ho ya update karni ho to
// woh drawer se seedha edit kar sake — bina delete/recreate ke.
const updateCompany = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, email, phone, address } = req.body;

        // Manual validation replaced by Zod

        // UPDATE query — sirf info fields update hongi, status touch nahi hoga
        await db.query(
            'UPDATE companies SET name=?, description=?, email=?, phone=?, address=?, updated_at=NOW() WHERE id=?',
            [name.trim(), description || null, email ? email.trim() : null, phone || null, address || null, id]
        );

        res.status(200).json({ success: true, message: 'Company updated successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// 6. ADD ORGANIZER TO A COMPANY
// ─────────────────────────────────────────────
// Kyun: PM kisi company ke drawer se seedha ek nayi organizer
// account bana sake aur use us company se link kar sake.
// bcrypt isliye use ho raha hai kyunke password plain text mein
// DB mein nahi rehna chahiye — yeh security ka basic rule hai.
const bcrypt = require('bcryptjs');

const addOrganizer = async (req, res, next) => {
    try {
        const { id: companyId } = req.params;               // URL se company ka id
        const { name, email, password } = req.body;

        // --- Zod validation will handle the basic checks ---

        // --- Company exist karti hai? ---
        const [companies] = await db.query('SELECT id FROM companies WHERE id = ?', [companyId]);
        if (companies.length === 0) {
            return res.status(404).json({ success: false, message: 'Company nahi mili' });
        }

        // --- Duplicate email check ---
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Yeh email pehle se registered hai' });
        }

        // --- Password hash karo ---
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- User insert karo —  role=ORGANIZER, company_id linked ---
        const [result] = await db.query(
            'INSERT INTO users (company_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, name.trim(), email.trim(), hashedPassword, 'ORGANIZER', 'ACTIVE']
        );

        res.status(201).json({
            success: true,
            message: 'Organizer successfully create ho gaya',
            data: { id: result.insertId, name: name.trim(), email: email.trim(), status: 'ACTIVE' }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllCompanies, getCompanyById, updateCompanyStatus, createCompany, updateCompany, addOrganizer };

