
const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// HELPER: Role validate karne ke liye
// Kyun: Yeh function baar baar use hoga, isliye alag nikal liya (DRY)
// ─────────────────────────────────────────────────────────────────
const VALID_ROLES = ['ORGANIZER', 'PARTICIPANT'];

// ─────────────────────────────────────────────────────────────────
// 1. GET USERS BY ROLE (List + Search + Pagination)
//    Route: GET /api/users?role=ORGANIZER&search=...&page=1&limit=10
//
// Kyun role=? query param use kiya?
// Ek hi function Organizer aur Participant dono handle karta hai.
// Agar alag alag function banate toh same code do jagah hota — DRY violation.
// ─────────────────────────────────────────────────────────────────
const getUsersByRole = async (req, res) => {
    try {
        const { role, search = '', page = 1, limit = 10 } = req.query;

        // Role validate karo — sirf ORGANIZER ya PARTICIPANT allowed hai
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Base query: users table se role ke hisaab se filter karo
        // Company name bhi chahiye isliye LEFT JOIN lagaya companies table se
        // LEFT JOIN kyun? — Agar kisi user ka company_id NULL hai toh bhi woh show ho
        let baseWhere = 'WHERE u.role = ?';
        const params = [role];

        if (search) {
            baseWhere += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Main query: user info + company name (agar linked ho)
        const dataQuery = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.status, 
                u.created_at,
                c.name AS company_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            ${baseWhere}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        // Count query: pagination ke liye total rows chahiye
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM users u 
            ${baseWhere}
        `;

        const [users] = await db.query(dataQuery, [...params, limitNum, offset]);
        const [countRows] = await db.query(countQuery, params);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('Get Users By Role Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// ─────────────────────────────────────────────────────────────────
// 2. GET SINGLE USER BY ID (Details)
//    Route: GET /api/users/:id
//
// Kyun: PM kisi user par click kare toh drawer mein detail dikhe.
// Organizer ke liye: uske events bhi dikhayenge (woh events jo us
// company ne create kiye jisme yeh organizer hai)
// Participant ke liye: uski registrations dikhayenge
// ─────────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. User ki basic info (company name ke saath)
        const [users] = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.role, u.status, u.created_at,
                c.name AS company_name, c.id AS company_id
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             WHERE u.id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        const extraData = {};

        // 2. Role ke hisaab se extra data fetch karo
        if (user.role === 'ORGANIZER' && user.company_id) {
            // Organizer ke company ke events
            const [events] = await db.query(
                `SELECT id, title, event_date, status 
                 FROM events 
                 WHERE company_id = ? 
                 ORDER BY event_date DESC 
                 LIMIT 5`,
                [user.company_id]
            );
            extraData.recentEvents = events;

        } else if (user.role === 'PARTICIPANT') {
            // Participant ki registrations (event name ke saath)
            const [registrations] = await db.query(
                `SELECT r.id, r.status, r.registered_at, e.title AS event_title, e.event_date
                 FROM registrations r
                 JOIN events e ON r.event_id = e.id
                 WHERE r.user_id = ?
                 ORDER BY r.registered_at DESC
                 LIMIT 5`,
                [id]
            );
            extraData.registrations = registrations;
        }

        res.status(200).json({
            success: true,
            data: { ...user, ...extraData }
        });

    } catch (error) {
        console.error('Get User By ID Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};

// ─────────────────────────────────────────────────────────────────
// 3. UPDATE USER STATUS (Activate / Suspend)
//    Route: PUT /api/users/:id/status
//    Body: { status: 'ACTIVE' | 'SUSPENDED' }
//
// Kyun: PM chahta hai Organizer ya Participant ko suspend kar sake
// bina delete kiye — yeh "Soft Control" pattern hai.
// Yahi pattern Company module mein bhi use kiya tha (DRY).
// ─────────────────────────────────────────────────────────────────
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['ACTIVE', 'SUSPENDED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be ACTIVE or SUSPENDED'
            });
        }

        // Pehle check karo ke user exist karta hai
        const [existing] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Sirf ORGANIZER aur PARTICIPANT ko update karo — PM ko protect karo
        if (!VALID_ROLES.includes(existing[0].role)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot change status of this user type'
            });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

        res.status(200).json({
            success: true,
            message: `User ${status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`
        });

    } catch (error) {
        console.error('Update User Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

module.exports = { getUsersByRole, getUserById, updateUserStatus };
