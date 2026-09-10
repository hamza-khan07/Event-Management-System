const db = require('../config/db');

const getPMStats = async (req, res, next) => {
    try {
        // Basic Stats (Organizers and Participants counted separately, excluding PRODUCT_MANAGER)
        const [companies] = await db.query('SELECT COUNT(*) as total FROM companies');
        const [organizers] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['ORGANIZER']);
        const [participants] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['PARTICIPANT']);
        const [events] = await db.query('SELECT COUNT(*) as total FROM events');

        // Growth Data (Organizers, Participants & Events for last 6 months - excludes PRODUCT_MANAGER)
        const [growthDataRaw] = await db.query(`
            SELECT 
                DATE_FORMAT(months.m, '%b') as name,
                COALESCE(o.organizers, 0) as organizers,
                COALESCE(p.participants, 0) as participants,
                (COALESCE(o.organizers, 0) + COALESCE(p.participants, 0)) as users,
                COALESCE(e.events, 0) as events
            FROM (
                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH) AS m UNION ALL
                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH) UNION ALL
                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH) UNION ALL
                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH) UNION ALL
                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) UNION ALL
                SELECT CURRENT_DATE
            ) as months
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as organizers 
                FROM users 
                WHERE role = 'ORGANIZER'
                GROUP BY month
            ) o ON DATE_FORMAT(months.m, '%Y-%m') = o.month
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as participants 
                FROM users 
                WHERE role = 'PARTICIPANT'
                GROUP BY month
            ) p ON DATE_FORMAT(months.m, '%Y-%m') = p.month
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as events 
                FROM events 
                GROUP BY month
            ) e ON DATE_FORMAT(months.m, '%Y-%m') = e.month
            ORDER BY months.m;
        `);

        // Distribution Data (Events by category)
        const [distributionRaw] = await db.query(`
            SELECT category as name, COUNT(*) as value
            FROM events
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category;
        `);

        // Top Organizers
        const [topOrganizersRaw] = await db.query(`
            SELECT 
                u.id, 
                u.name, 
                COALESCE(c.name, 'No Company') as company, 
                COUNT(e.id) as events, 
                u.status
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            LEFT JOIN events e ON e.company_id = c.id
            WHERE u.role = 'ORGANIZER'
            GROUP BY u.id, u.name, c.name, u.status
            ORDER BY events DESC
            LIMIT 5;
        `);

        res.status(200).json({
            success: true,
            data: {
                totalCompanies: companies[0].total,
                totalOrganizers: organizers[0].total,
                totalParticipants: participants[0].total,
                totalEvents: events[0].total,
                growthData: growthDataRaw,
                distributionData: distributionRaw,
                topOrganizers: topOrganizersRaw
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPMStats };
