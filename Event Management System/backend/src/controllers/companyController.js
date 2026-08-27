// backend/src/controllers/companyController.js
const db = require('../config/db');

// ─────────────────────────────────────────────
// 1. GET ALL COMPANIES (with Search + Pagination)
// ─────────────────────────────────────────────
// Kyun: PM ko saari companies ek table mein dekhni hain.
// Search aur pagination isliye ke data zyada hone par bhi
// page hang na ho (performance best practice).
const getAllCompanies = async (req, res) => {
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
        console.error('Get Companies Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch companies' });
    }
};

// ─────────────────────────────────────────────
// 2. GET SINGLE COMPANY (with its Organizers)
// ─────────────────────────────────────────────
// Kyun: PM kisi ek company par click kare to uski poori
// details aur us se linked organizers dikhayi jayein (JOIN query).
const getCompanyById = async (req, res) => {
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
        console.error('Get Company Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch company' });
    }
};


// ─────────────────────────────────────────────
// 3. UPDATE COMPANY STATUS (Activate / Suspend)
// ─────────────────────────────────────────────
// Kyun: PM chahta hai ke kisi company ko bina delete kiye
// temporarily band kar sake. Yeh "Soft Control" hai.
const updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' ya 'suspended'

        // Validation: sirf yeh 2 values allowed hain
        const allowedStatuses = ['ACTIVE', 'SUSPENDED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        await db.query('UPDATE companies SET status = ? WHERE id = ?', [status, id]);

        res.status(200).json({
            success: true,
            message: `Company ${status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'} successfully`
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

module.exports = { getAllCompanies, getCompanyById, updateCompanyStatus };
