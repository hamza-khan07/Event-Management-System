const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// HELPER: Validate user role
// ─────────────────────────────────────────────────────────────────
const VALID_ROLES = ['ORGANIZER', 'PARTICIPANT'];

// ─────────────────────────────────────────────────────────────────
// 1. GET USERS BY ROLE (List + Search + Pagination)
//    Route: GET /api/users?role=ORGANIZER&search=...&page=1&limit=10
// ─────────────────────────────────────────────────────────────────
const getUsersByRole = async (req, res, next) => {
    try {
        const { role, search = '', page = 1, limit = 10 } = req.query;

        // Role validation — restricted to ORGANIZER or PARTICIPANT
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Base query with LEFT JOIN on companies to include company name if linked
        let baseWhere = 'WHERE u.role = ?';
        const params = [role];

        if (search) {
            baseWhere += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

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
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────
// 2. GET SINGLE USER BY ID (Details)
//    Route: GET /api/users/:id
// ─────────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Fetch user profile with associated company name
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

        // 2. Fetch role-specific context
        if (user.role === 'ORGANIZER' && user.company_id) {
            // Organizer's company events (all events for this company)
            const [events] = await db.query(
                `SELECT id, title, event_date, status 
                 FROM events 
                 WHERE company_id = ? 
                 ORDER BY event_date DESC`,
                [user.company_id]
            );
            extraData.recentEvents = events;
            extraData.events = events;

        } else if (user.role === 'PARTICIPANT') {
            // Participant's event registrations
            const [registrations] = await db.query(
                `SELECT r.id, r.status, r.registered_at, e.title AS event_title, e.event_date
                 FROM registrations r
                 JOIN events e ON r.event_id = e.id
                 WHERE r.user_id = ?
                 ORDER BY r.registered_at DESC`,
                [id]
            );
            extraData.registrations = registrations;
        }

        res.status(200).json({
            success: true,
            data: { ...user, ...extraData }
        });

    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────
// 3. UPDATE USER STATUS (Activate / Suspend)
//    Route: PUT /api/users/:id/status
//    Body: { status: 'ACTIVE' | 'SUSPENDED' }
// ─────────────────────────────────────────────────────────────────
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Check if user exists
        const [existing] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Only allow status changes for ORGANIZER and PARTICIPANT (protect PM accounts)
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
        next(error);
    }
};

module.exports = { getUsersByRole, getUserById, updateUserStatus };
