// backend/src/controllers/organizerController.js

const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// SECURITY HELPER: Check if organizer owns the target company
// ─────────────────────────────────────────────────────────────────
const isOrganizerOwner = (req, companyId) => {
    return req.user.company_id === parseInt(companyId);
};


// ─────────────────────────────────────────────────────────────────
// 1. GET MY COMPANY
//    Route: GET /api/organizer/my-company
// ─────────────────────────────────────────────────────────────────
const getMyCompany = async (req, res, next) => {
    try {
        const company_id = req.user.company_id;

        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'You are not linked to any company. Please contact admin.'
            });
        }

        // Fetch company profile details
        const [companies] = await db.query(
            'SELECT id, name, description, email, phone, website, address, logo, banner, tagline, status, created_at FROM companies WHERE id = ?',
            [company_id]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found.'
            });
        }

        // Fetch organizers linked to this company
        const [organizers] = await db.query(
            `SELECT id, name, email, status 
             FROM users 
             WHERE company_id = ? AND role = 'ORGANIZER'`,
            [company_id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...companies[0],
                organizers
            }
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 2. UPDATE MY COMPANY
//    Route: PUT /api/organizer/my-company
// ─────────────────────────────────────────────────────────────────
const updateMyCompany = async (req, res, next) => {
    try {
        const company_id = req.user.company_id;

        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'You are not linked to any company.'
            });
        }

        const { name, description, email, phone, website, address, logo, banner, tagline } = req.body;

        // Update company profile details (status cannot be altered by organizers)
        await db.query(
            `UPDATE companies 
             SET name = ?, description = ?, email = ?, phone = ?, website = ?, address = ?, logo = ?, banner = ?, tagline = ?
             WHERE id = ?`,
            [
                name.trim(),
                description || null,
                email || null,
                phone || null,
                website || null,
                address || null,
                logo || null,
                banner || null,
                tagline || null,
                company_id
            ]
        );

        // Fetch updated record
        const [updated] = await db.query(
            'SELECT id, name, description, email, phone, website, address, logo, banner, tagline, status FROM companies WHERE id = ?',
            [company_id]
        );

        res.status(200).json({
            success: true,
            message: 'Company updated successfully.',
            data: updated[0]
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 4. GET OVERVIEW STATS (Organizer Dashboard Analytics)
//    Route: GET /api/organizer/overview-stats
// ─────────────────────────────────────────────────────────────────
const getOrganizerOverviewStats = async (req, res, next) => {
    try {
        const company_id = req.user.company_id;

        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'You are not linked to any company.'
            });
        }

        // ── 1. Summary Metrics ───────────────────────────────────────
        // Total events for this company
        const [totalEventsRows] = await db.query(
            'SELECT COUNT(*) as count FROM events WHERE company_id = ?',
            [company_id]
        );

        // Active (REGISTERED) registrations across all company events
        const [activeRegsRows] = await db.query(
            `SELECT COUNT(*) as count 
             FROM registrations r
             JOIN events e ON r.event_id = e.id
             WHERE e.company_id = ? AND r.status = 'REGISTERED'`,
            [company_id]
        );

        // Total capacity across company events
        const [capacityRows] = await db.query(
            'SELECT COALESCE(SUM(capacity), 0) as total FROM events WHERE company_id = ?',
            [company_id]
        );

        // Upcoming active events
        const [upcomingRows] = await db.query(
            `SELECT COUNT(*) as count FROM events 
             WHERE company_id = ? AND event_date >= CURDATE() AND status != 'CANCELLED'`,
            [company_id]
        );

        // ── 2. Registration Trend (Last 6 Months) ────────────────────
        const [trendRows] = await db.query(
            `SELECT 
                DATE_FORMAT(r.registered_at, '%b %Y') as month,
                COUNT(*) as registrations
             FROM registrations r
             JOIN events e ON r.event_id = e.id
             WHERE e.company_id = ?
               AND r.registered_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY YEAR(r.registered_at), MONTH(r.registered_at)
             ORDER BY YEAR(r.registered_at), MONTH(r.registered_at)`,
            [company_id]
        );

        // ── 3. Events by Status (Pie/Donut chart) ─────────────────────
        const [statusRows] = await db.query(
            `SELECT status, COUNT(*) as count 
             FROM events 
             WHERE company_id = ? 
             GROUP BY status`,
            [company_id]
        );

        // ── 4. Recent Events (Top 5) ─────────────────────────────────
        const [recentRows] = await db.query(
            `SELECT 
                e.id,
                e.title,
                e.event_date,
                e.capacity,
                e.status,
                COUNT(r.id) as registrations,
                ROUND(
                    COALESCE(COUNT(r.id) / NULLIF(e.capacity, 0) * 100, 0),
                    1
                ) as fillRate
             FROM events e
             LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'REGISTERED'
             WHERE e.company_id = ?
             GROUP BY e.id, e.title, e.event_date, e.capacity, e.status
             ORDER BY e.created_at DESC
             LIMIT 5`,
            [company_id]
        );

        // ── Final Response ────────────────────────────────────────────
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalEvents: totalEventsRows[0].count,
                    activeRegistrations: activeRegsRows[0].count,
                    totalCapacity: capacityRows[0].total,
                    upcomingEvents: upcomingRows[0].count
                },
                registrationTrend: trendRows,
                eventsByStatus: statusRows,
                recentEvents: recentRows
            }
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 5. GET MY PARTICIPANTS
//    Route: GET /api/organizer/my-participants
// ─────────────────────────────────────────────────────────────────
const getMyParticipants = async (req, res, next) => {
    try {
        const company_id = req.user.company_id;

        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'You are not linked to any company.'
            });
        }

        // Parse query parameters
        const search  = req.query.search  || '';
        const eventId = req.query.eventId || '';
        const status  = req.query.status  || '';
        const pageNum  = Math.max(1, parseInt(req.query.page)  || 1);
        const limitNum = Math.min(100, parseInt(req.query.limit) || 10);
        const offset   = (pageNum - 1) * limitNum;

        // ── Dynamic WHERE clause ──────────────────────────────────
        const conditions = ['e.company_id = ?'];
        const params     = [company_id];

        // Optional: Filter by event
        if (eventId) {
            conditions.push('r.event_id = ?');
            params.push(parseInt(eventId));
        }

        // Optional: Filter by registration status
        if (status) {
            conditions.push('r.status = ?');
            params.push(status);
        }

        // Optional: Search by name or email
        if (search) {
            conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = conditions.join(' AND ');

        // ── Total count for pagination ────────────────────────────
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total
             FROM registrations r
             JOIN users u  ON r.user_id  = u.id
             JOIN events e ON r.event_id = e.id
             WHERE ${whereClause}`,
            params
        );
        const total = countRows[0].total;

        // ── Paginated participants data ───────────────────────────
        const [participants] = await db.query(
            `SELECT
                r.id                AS registration_id,
                r.registration_code,
                r.ticket_count,
                r.phone_number,
                r.status            AS registration_status,
                r.registered_at,
                u.id                AS participant_id,
                u.name              AS participant_name,
                u.email             AS participant_email,
                e.id                AS event_id,
                e.title             AS event_title,
                e.event_date
             FROM registrations r
             JOIN users u  ON r.user_id  = u.id
             JOIN events e ON r.event_id = e.id
             WHERE ${whereClause}
             ORDER BY r.registered_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        // ── Events dropdown list for filters ──────────────────────
        const [eventsList] = await db.query(
            `SELECT id, title, event_date, status
             FROM events
             WHERE company_id = ?
             ORDER BY event_date DESC`,
            [company_id]
        );

        res.status(200).json({
            success: true,
            data: participants,
            events: eventsList,
            pagination: {
                total,
                currentPage:  pageNum,
                totalPages:   Math.ceil(total / limitNum),
                limit:        limitNum
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getMyCompany, updateMyCompany, getOrganizerOverviewStats, getMyParticipants };
