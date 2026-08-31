// backend/src/controllers/organizerController.js

const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// SECURITY HELPER: Organizer apni company ka owner hai ya nahi?
//
// Kyun alag helper function?
// Yeh check MULTIPLE jagah chahiye (getMyCompany, updateMyCompany).
// Agar alag na nikale toh same check baar baar likhna padta — DRY violation.
//
// req.user.company_id → JWT token se aata hai (authMiddleware ne attach kiya)
// companyId           → URL params se aata hai
// ─────────────────────────────────────────────────────────────────
const isOrganizerOwner = (req, companyId) => {
    // parseInt isliye: params se string aata hai, company_id number hai
    return req.user.company_id === parseInt(companyId);
};


// ─────────────────────────────────────────────────────────────────
// 1. GET MY COMPANY
//    Route: GET /api/organizer/my-company
//
// Kyun /my-company route?
// Organizer ko company ID URL mein type nahi karni chahiye.
// Woh apne JWT token se automatically identify ho jata hai.
// req.user.company_id → authMiddleware ne JWT se nikal kar attach kiya.
// ─────────────────────────────────────────────────────────────────
const getMyCompany = async (req, res, next) => {
    try {
        // JWT token mein company_id store hai (login ke waqt set hua tha)
        const company_id = req.user.company_id;

        // Agar organizer ka koi company link nahi — edge case handle karo
        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'You are not linked to any company. Please contact admin.'
            });
        }

        // Company ki info fetch karo
        const [companies] = await db.query(
            'SELECT id, name, description, email, phone, address, status, created_at FROM companies WHERE id = ?',
            [company_id]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found.'
            });
        }

        // Us company ke linked organizers bhi fetch karo (team members dekhne ke liye)
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
                organizers // Company ka poora team
            }
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 2. UPDATE MY COMPANY
//    Route: PUT /api/organizer/my-company
//
// Kyun ownership check zaroori hai?
// URL mein koi ID nahi hai — Organizer sirf apni company update kare.
// JWT ke company_id se directly update karte hain — safe!
//
// Kya update ho sakta hai? — name, description, email, phone, address
// Kya update NAHI ho sakta? — status (sirf PM status change karta hai)
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

        // Sirf yeh fields update karne ki permission hai organizer ko
        const { name, description, email, phone, address } = req.body;

        // Manual validation replaced by Zod Validation Middleware

        // Update karo — sirf apni company (company_id JWT se aaya, URL se nahi)
        // Yahi security hai: URL mein koi ID nahi, token se pata chalta hai
        await db.query(
            `UPDATE companies 
             SET name = ?, description = ?, email = ?, phone = ?, address = ?
             WHERE id = ?`,
            [
                name.trim(),
                description || null,
                email || null,
                phone || null,
                address || null,
                company_id
            ]
        );

        // Updated company wapis bhejo
        const [updated] = await db.query(
            'SELECT id, name, description, email, phone, address, status FROM companies WHERE id = ?',
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


// // ─────────────────────────────────────────────────────────────────
// // 3. GET MY PROFILE
// //    Route: GET /api/organizer/my-profile
// //
// // Kyun yeh chahiye?
// // Organizer apna naam, email, company link sab ek jagah dekhna chahta hai.
// // JWT mein basic info hai, lekin hum fresh DB data chahte hain (status bhi).
// // ─────────────────────────────────────────────────────────────────
// const getMyProfile = async (req, res) => {
//     try {
//         const [users] = await db.query(
//             `SELECT 
//                 u.id, u.name, u.email, u.role, u.status, u.created_at,
//                 c.name AS company_name, c.id AS company_id, c.status AS company_status
//              FROM users u
//              LEFT JOIN companies c ON u.company_id = c.id
//              WHERE u.id = ?`,
//             [req.user.id]
//         );

//         if (users.length === 0) {
//             return res.status(404).json({ success: false, message: 'Profile not found.' });
//         }

//         res.status(200).json({
//             success: true,
//             data: users[0]
//         });

//     } catch (error) {
//         console.error('Get My Profile Error:', error);
//         res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
//     }
// };


// ─────────────────────────────────────────────────────────────────
// 4. GET OVERVIEW STATS (Organizer Dashboard Analytics)
//    Route: GET /api/organizer/overview-stats
//
// Kyun: OrganizerDashboardPage ko 4 stat cards + chart data chahiye.
// Sab kuch ek API call mein bhejte hain (performance: ek trip to server).
//
// Jo data bhejenge:
//   summary           → 4 stat card numbers
//   registrationTrend → Line chart data (last 6 months)
//   eventsByStatus    → Pie/donut chart data
//   recentEvents      → Table mein last 5 events
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

        // ── 1. SUMMARY NUMBERS ───────────────────────────────────────
        // Kyun alag alag queries?
        // Ek complex query mein sab karna mushkil aur debug karna aur bhi mushkil hota.
        // Alag queries → readable, maintainable.

        // Total events of this company
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

        // Total capacity of all events
        const [capacityRows] = await db.query(
            'SELECT COALESCE(SUM(capacity), 0) as total FROM events WHERE company_id = ?',
            [company_id]
        );

        // Upcoming events (future date, not cancelled)
        const [upcomingRows] = await db.query(
            `SELECT COUNT(*) as count FROM events 
             WHERE company_id = ? AND event_date >= CURDATE() AND status != 'CANCELLED'`,
            [company_id]
        );

        // ── 2. REGISTRATION TREND (Last 6 months) ────────────────────
        // DATE_FORMAT: MySQL ka function jo date ko 'Jan 2025' jaisi string mein badalta hai
        // MONTH() / YEAR() se last 6 months filter karte hain
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

        // ── 3. EVENTS BY STATUS (Pie chart) ──────────────────────────
        const [statusRows] = await db.query(
            `SELECT status, COUNT(*) as count 
             FROM events 
             WHERE company_id = ? 
             GROUP BY status`,
            [company_id]
        );

        // ── 4. RECENT EVENTS TABLE (last 5) ──────────────────────────
        // Fill rate = registrations / capacity * 100
        // COALESCE: agar NULL aaye to 0 use karo (koi registration nahi)
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



module.exports = { getMyCompany, updateMyCompany, getOrganizerOverviewStats };
