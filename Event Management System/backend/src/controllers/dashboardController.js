const db = require('../config/db');
const getPMStats = async (req, res) => {
    try {
        // Query 1: Database mein mojood tamam companies ko ginte hain
        const [companies] = await db.query('SELECT COUNT(*) as total FROM companies');

        // Query 2: Sirf un users ko ginte hain jinka role 'ORGANIZER' hai
        const [organizers] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['ORGANIZER']);

        // Query 3: Sirf un users ko ginte hain jinka role 'PARTICIPANT' hai
        const [participants] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['PARTICIPANT']);

        // Query 4: Database mein mojood tamam events ko ginte hain
        const [events] = await db.query('SELECT COUNT(*) as total FROM events');

        // Sab numbers nikal aaye, ab frontend ko json response bhej do
        res.status(200).json({
            success: true,
            data: {
                totalCompanies: companies[0].total,
                totalOrganizers: organizers[0].total,
                totalParticipants: participants[0].total,
                totalEvents: events[0].total
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error: ", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics"
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        // Query parameters se pagination aur filters utha rahe hain (ya phir default values)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const status = req.query.status || '';

        // Offset calculate kar rahe hain ke konsi row se data uthana shuru karna hai
        const offset = (page - 1) * limit;

        // 1=1 isliye rakha taake 'AND' lagane me asani ho
        let query = 'SELECT id, name, email, role, status, created_at FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const queryParams = [];
        // 1. Search Logic
        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            countQuery += ' AND (name LIKE ? OR email LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        // 2. Role Filter Logic
        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            queryParams.push(role);
        }
        // 3. Status Filter Logic
        if (status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            queryParams.push(status);
        }
        // Ordering aur Pagination limit lagana (Limit sirf main query pe lagti hai count pe nahi)
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        // Dono queries chalana (Data laane k lie aur total ginti karne k lie)
        const [users] = await db.query(query, [...queryParams, limit, offset]);
        const [totalRows] = await db.query(countQuery, queryParams);
        const totalUsers = totalRows[0].total;
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Fetch Users Error: ", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};


module.exports = { getPMStats, getAllUsers };

