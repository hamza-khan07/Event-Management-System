// backend/src/controllers/companyController.js
const db = require('../config/db');

// ─────────────────────────────────────────────
// 1. GET ALL COMPANIES (with Search + Pagination)
// ─────────────────────────────────────────────
// Displays companies in a table with search and pagination for performance.
const getAllCompanies = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        // Dynamic query: Append WHERE clause if search query is provided
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
// Retrieves full company profile details and linked organizers.
const getCompanyById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Basic company details
        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
        if (companies.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // 2. Organizers linked to this company
        const [organizers] = await db.query(
            `SELECT u.id, u.name, u.email, u.status 
             FROM users u 
             WHERE u.company_id = ? AND u.role = 'ORGANIZER'`,
            [id]
        );

        // 3. Total events count for this company
        const [eventCount] = await db.query(
            `SELECT COUNT(*) as total FROM events WHERE company_id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...companies[0],
                organizers,
                totalEvents: eventCount[0].total
            }
        });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────
// 3. UPDATE COMPANY STATUS (Activate / Suspend)
// ─────────────────────────────────────────────
// Soft control: Allows Product Manager to suspend or reactivate a company without deleting records.
const updateCompanyStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'

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
        const { name, description, email, phone, address, website, logo, banner, tagline } = req.body;

        const [result] = await db.query(
            'INSERT INTO companies (name, description, email, phone, address, website, logo, banner, tagline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name.trim(),
                description || null,
                email ? email.trim() : null,
                phone || null,
                address || null,
                website || null,
                logo || null,
                banner || null,
                tagline || null,
                'ACTIVE'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: {
                id: result.insertId,
                name: name.trim(),
                description: description || null,
                email: email ? email.trim() : null,
                phone: phone || null,
                address: address || null,
                website: website || null,
                logo: logo || null,
                banner: banner || null,
                tagline: tagline || null,
                status: 'ACTIVE'
            }
        });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────
// 5. UPDATE COMPANY INFO (name, email, phone, description, address, website, logo, banner, tagline)
// ─────────────────────────────────────────────
// Allows in-place editing of company information without modifying its status.
const updateCompany = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, email, phone, address, website, logo, banner, tagline } = req.body;

        // Update company profile attributes
        await db.query(
            'UPDATE companies SET name=?, description=?, email=?, phone=?, address=?, website=?, logo=?, banner=?, tagline=?, updated_at=NOW() WHERE id=?',
            [
                name.trim(),
                description || null,
                email ? email.trim() : null,
                phone || null,
                address || null,
                website || null,
                logo || null,
                banner || null,
                tagline || null,
                id
            ]
        );

        res.status(200).json({ success: true, message: 'Company updated successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// 6. ADD ORGANIZER TO A COMPANY
// ─────────────────────────────────────────────
// Allows the Product Manager to create and link a new organizer account directly to a company.
const bcrypt = require('bcryptjs');

const addOrganizer = async (req, res, next) => {
    try {
        const { id: companyId } = req.params;               // Company ID from URL parameters
        const { name, email, password } = req.body;

        // --- Verify company exists ---
        const [companies] = await db.query('SELECT id FROM companies WHERE id = ?', [companyId]);
        if (companies.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // --- Duplicate email check ---
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This email is already registered' });
        }

        // --- Hash password ---
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- Insert organizer user record linked to company ---
        const [result] = await db.query(
            'INSERT INTO users (company_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, name.trim(), email.trim(), hashedPassword, 'ORGANIZER', 'ACTIVE']
        );

        res.status(201).json({
            success: true,
            message: 'Organizer created successfully',
            data: { id: result.insertId, name: name.trim(), email: email.trim(), status: 'ACTIVE' }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllCompanies, getCompanyById, updateCompanyStatus, createCompany, updateCompany, addOrganizer };
