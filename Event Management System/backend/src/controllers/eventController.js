// backend/src/controllers/eventController.js

const db = require('../config/db');

// Safe coordinate parser
const parseCoordinate = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
};

// ─────────────────────────────────────────────────────────────────
// 1. CREATE EVENT
//    Route: POST /api/events/create
//    Access: ORGANIZER only (creates event for their associated company)
//
// Company ID is extracted securely from the JWT payload (never from the body).
// registration_deadline is required and stored as a DATE column.
// ─────────────────────────────────────────────────────────────────
const createEvent = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            venue,
            latitude,               // Auto-geocoded from venue — sent by frontend
            longitude,              // Auto-geocoded from venue — sent by frontend
            event_date,
            start_time,
            end_time,
            registration_deadline,       // Required cutoff date for registrations
            registration_deadline_time,  // Optional: exact closing time on deadline day
            capacity,
            status,
            price,        // Ticket price — e.g., "Free" or "PKR 2,500"
            image_url     // Event banner image URL
        } = req.body;

        const company_id = req.user.company_id;

        // ── Verify company link ──
        if (!company_id) {
            return res.status(400).json({
                success: false,
                message: 'Your account is not linked to any company. Contact admin.'
            });
        }

        // ── End time validation ──
        if (end_time <= start_time) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time.'
            });
        }

        // ── Status validation ──
        const allowedStatuses = ['DRAFT', 'PUBLISHED'];
        const eventStatus = status && allowedStatuses.includes(status) ? status : 'DRAFT';

        // ── DB Insert — includes latitude/longitude from geocoding ──
        const [result] = await db.query(
            `INSERT INTO events 
                (company_id, title, description, category, venue, latitude, longitude,
                 event_date, start_time, end_time,
                 registration_deadline, registration_deadline_time,
                 capacity, status, price, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company_id,
                title.trim(),
                description || null,
                category || null,
                venue || null,
                parseCoordinate(latitude),
                parseCoordinate(longitude),
                event_date,
                start_time,
                end_time,
                registration_deadline,                 // Stored as YYYY-MM-DD DATE string
                registration_deadline_time.trim(),     // Stored as HH:MM:SS TIME string (required)
                capacity,
                eventStatus,
                price ? price.trim() : 'Free',
                image_url || null
            ]
        );

        // ── Fetch and return created event ──
        const [newEvent] = await db.query(
            'SELECT * FROM events WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: `Event "${title.trim()}" created successfully as ${eventStatus}!`,
            data: newEvent[0]
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 2. GET MY EVENTS (List of events for organizer's company)
//    Route: GET /api/events/my-events?search=...&status=...&page=1&limit=10
//    registration_deadline is included so the organizer dashboard can display it.
// ─────────────────────────────────────────────────────────────────
const getMyEvents = async (req, res, next) => {
    try {
        const company_id = req.user.company_id;

        if (!company_id) {
            return res.status(404).json({
                success: false,
                message: 'No company linked to your account.'
            });
        }

        const { search = '', status = '', page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build dynamic WHERE clause
        let baseWhere = 'WHERE e.company_id = ?';
        const params = [company_id];

        if (search) {
            baseWhere += ' AND (e.title LIKE ? OR e.venue LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status && ['DRAFT', 'PUBLISHED', 'CANCELLED'].includes(status)) {
            baseWhere += ' AND e.status = ?';
            params.push(status);
        }

        const dataQuery = `
            SELECT 
                e.id, e.title, e.description, e.category, e.venue, e.event_date,
                e.start_time, e.end_time, e.registration_deadline, e.registration_deadline_time,
                e.capacity, e.price, e.image_url, e.status, e.created_at,
                COUNT(r.id) as registrations
            FROM events e
            LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'REGISTERED'
            ${baseWhere}
            GROUP BY e.id, e.title, e.description, e.category, e.venue,
                     e.event_date, e.start_time, e.end_time, e.registration_deadline, e.registration_deadline_time,
                     e.capacity, e.price, e.image_url, e.status, e.created_at
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total FROM events e ${baseWhere}
        `;

        const [events] = await db.query(dataQuery, [...params, limitNum, offset]);
        const [countRows] = await db.query(countQuery, params);

        res.status(200).json({
            success: true,
            data: events,
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
// 3. UPDATE EVENT STATUS
//    Route: PUT /api/events/:id/status
//    Body: { status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' }
// ─────────────────────────────────────────────────────────────────
const updateEventStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const company_id = req.user.company_id;

        // Verify event ownership
        const [events] = await db.query(
            'SELECT id, company_id FROM events WHERE id = ?',
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        if (events[0].company_id !== company_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update events belonging to your company.'
            });
        }

        await db.query('UPDATE events SET status = ? WHERE id = ?', [status, id]);

        res.status(200).json({
            success: true,
            message: `Event ${status === 'PUBLISHED' ? 'published' : status === 'CANCELLED' ? 'cancelled' : 'moved to draft'} successfully.`
        });

    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 4. UPDATE EVENT (Edit)
//    Route: PUT /api/events/:id
//    Access: ORGANIZER only
//    Includes registration_deadline in the updatable fields.
// ─────────────────────────────────────────────────────────────────
const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        const {
            title, description, category, venue,
            latitude,               // Updated via geocoding when venue changes
            longitude,              // Updated via geocoding when venue changes
            event_date, start_time, end_time,
            registration_deadline,       // Updated deadline (must be <= event_date)
            registration_deadline_time,  // Updated closing time (optional)
            capacity, price, image_url, status
        } = req.body;

        // 1. Ownership Check
        const [events] = await db.query(
            'SELECT id, company_id FROM events WHERE id = ?',
            [id]
        );
        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        if (events[0].company_id !== company_id) {
            return res.status(403).json({ success: false, message: 'You can only edit your own events.' });
        }

        // 2. End time check
        if (start_time && end_time && end_time <= start_time) {
            return res.status(400).json({ success: false, message: 'End time must be after start time.' });
        }

        // 3. Validate status — edit form allows setting DRAFT or PUBLISHED
        const allowedStatuses = ['DRAFT', 'PUBLISHED'];
        const newStatus = status && allowedStatuses.includes(status) ? status : null;

        // 4. Parse coordinates safely
        const parsedLat = parseCoordinate(latitude);
        const parsedLng = parseCoordinate(longitude);

        // 5. Execute update — lat/lng use direct assignment (not COALESCE) so they always
        //    reflect whatever the frontend sends. All other fields use COALESCE so that
        //    partial updates (e.g. status-only change) don't wipe other fields.
        await db.query(
            `UPDATE events 
             SET title                      = COALESCE(?, title),
                 description                = COALESCE(?, description),
                 category                   = COALESCE(?, category),
                 venue                      = COALESCE(?, venue),
                 latitude                   = ?,
                 longitude                  = ?,
                 event_date                 = COALESCE(?, event_date),
                 start_time                 = COALESCE(?, start_time),
                 end_time                   = COALESCE(?, end_time),
                 registration_deadline      = COALESCE(?, registration_deadline),
                 registration_deadline_time = COALESCE(?, registration_deadline_time),
                 capacity                   = COALESCE(?, capacity),
                 price                      = COALESCE(?, price),
                 image_url                  = COALESCE(?, image_url),
                 status                     = COALESCE(?, status)
             WHERE id = ?`,
            [
                title, description, category, venue,
                parsedLat, parsedLng,
                event_date, start_time, end_time,
                registration_deadline,
                registration_deadline_time ? registration_deadline_time.trim() : null,
                capacity, price, image_url, newStatus, id
            ]
        );

        const statusMsg = newStatus === 'PUBLISHED'
            ? 'Event updated and published successfully.'
            : newStatus === 'DRAFT'
                ? 'Event saved as draft successfully.'
                : 'Event updated successfully.';

        res.status(200).json({ success: true, message: statusMsg });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────
// 5. DELETE EVENT (Hard Delete)
//    Route: DELETE /api/events/:id
//    Access: ORGANIZER only (DRAFT events only)
// ─────────────────────────────────────────────────────────────────
const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        // 1. Check Ownership & Status
        const [events] = await db.query(
            'SELECT id, company_id, status FROM events WHERE id = ?',
            [id]
        );
        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        if (events[0].company_id !== company_id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own events.' });
        }

        // 2. Business Rule: Only DRAFT events can be permanently deleted to protect attendee records
        if (events[0].status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: 'Only DRAFT events can be deleted. If you want to stop this event, change its status to CANCELLED instead.'
            });
        }

        // 3. Delete event record
        await db.query('DELETE FROM events WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Event deleted permanently.' });
    } catch (error) {
        next(error);
    }
};


// ─────────────────────────────────────────────────────────────────
// 6. GET PUBLIC EVENTS (Publicly accessible list of published events)
//    Route: GET /api/events/public?search=&category=&page=1&limit=9
//    Access: Public
//
//    AUTO-HIDE RULE: Events whose event_date is before today are excluded.
//    This is done at the SQL level using CURDATE() — no cron job needed.
//    The day after an event occurs, it automatically disappears from public listings.
// ─────────────────────────────────────────────────────────────────
const getPublicEvents = async (req, res, next) => {
    try {
        const { search = '', category = '', page = 1, limit = 9, price = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Base filter: Only PUBLISHED events that haven't passed yet.
        // e.event_date >= CURDATE() ensures events are hidden the day AFTER they occur.
        let baseWhere = "WHERE e.status = 'PUBLISHED' AND e.event_date >= CURDATE()";
        const params = [];

        // Search filter on title, venue, or description
        if (search) {
            baseWhere += ' AND (e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Category filter
        if (category) {
            baseWhere += ' AND e.category = ?';
            params.push(category);
        }

        // Price filter: Free vs Paid
        if (price === 'Free') {
            baseWhere += " AND (e.price IS NULL OR e.price = '' OR LOWER(e.price) = 'free' OR e.price = '0')";
        } else if (price === 'Paid') {
            baseWhere += " AND (e.price IS NOT NULL AND e.price != '' AND LOWER(e.price) != 'free' AND e.price != '0')";
        }

        const dataQuery = `
            SELECT
                e.id, e.title, e.description, e.category,
                e.venue, e.event_date, e.start_time, e.end_time,
                e.registration_deadline, e.registration_deadline_time,
                e.capacity, e.price, e.image_url, e.status,
                e.latitude, e.longitude,
                c.name as organizer_name,
                c.logo as organizer_logo,
                c.banner as organizer_banner,
                c.tagline as organizer_tagline,
                c.website as organizer_website
            FROM events e
            JOIN companies c ON c.id = e.company_id
            ${baseWhere}
            ORDER BY e.event_date ASC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `SELECT COUNT(*) as total FROM events e ${baseWhere}`;

        const [events] = await db.query(dataQuery, [...params, limitNum, offset]);
        const [countRows] = await db.query(countQuery, params);

        res.status(200).json({
            success: true,
            data: events,
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
// 7. GET SINGLE PUBLIC EVENT BY ID
//    Route: GET /api/events/public/:id
//    Access: Public
//    registration_deadline is included so the frontend can show the deadline
//    and conditionally disable the register button.
// ─────────────────────────────────────────────────────────────────
const getPublicEventById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [events] = await db.query(
            `SELECT
                e.id, e.title, e.description, e.category,
                e.venue, e.latitude, e.longitude,
                e.event_date, e.start_time, e.end_time,
                e.registration_deadline, e.registration_deadline_time,
                e.capacity, e.price, e.image_url, e.status,
                c.name as organizer_name,
                c.id   as organizer_id,
                c.logo as organizer_logo,
                c.banner as organizer_banner,
                c.tagline as organizer_tagline,
                c.website as organizer_website
             FROM events e
             JOIN companies c ON c.id = e.company_id
             WHERE e.id = ? AND e.status = 'PUBLISHED'`,
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        res.status(200).json({ success: true, data: events[0] });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────
// 8. GET HEATMAP DATA (Lightweight API for Map View)
//    Route: GET /api/events/public/heatmap
//    Access: Public
// ─────────────────────────────────────────────────────────────────
const getHeatmapData = async (req, res, next) => {
    try {
        // Fetch only upcoming published events that have coordinates
        const [events] = await db.query(
            `SELECT id, title, category, latitude, longitude, event_date 
             FROM events 
             WHERE status = 'PUBLISHED' 
             AND event_date >= CURDATE()
             AND latitude IS NOT NULL 
             AND longitude IS NOT NULL`
        );

        res.status(200).json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createEvent,
    getMyEvents,
    updateEventStatus,
    updateEvent,
    deleteEvent,
    getPublicEvents,
    getPublicEventById,
    getHeatmapData
};
