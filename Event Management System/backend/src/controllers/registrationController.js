// backend/src/controllers/registrationController.js
//
// RESPONSIBILITY: Event registration ke sab operations handle karo.
//
// Functions:
//   1. registerForEvent    → POST /api/registrations/:eventId
//   2. cancelMyRegistration → PUT /api/registrations/:id/cancel
//   3. getMyRegistrations  → GET /api/registrations/my
//
// Design Decisions:
//   - user_id hamesha JWT (req.user.id) se aata hai — URL se nahi.
//     Kyun? Security: koi bhi user ka ID URL mein dal kar doosre ki behalf se register na kare.
//   - registration_code backend pe generate hota hai — frontend pe nahi.
//     Kyun? Frontend user manipulate kar sakta hai, backend trusted source hai.

const db = require('../config/db');

// ─── Helper: Unique Registration Code Generate Karna ──────────────────────────
// Format: EVT-XXXX-XXXX (e.g., EVT-A3F2-K9P1)
// Math.random().toString(36) → base36 string (digits + letters)
// .substring(2, 6).toUpperCase() → 4 character slice, uppercase
// Kyun yeh approach? Simple, readable, no extra library needed.
const generateRegistrationCode = () => {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EVT-${part1}-${part2}`;
};


// ═══════════════════════════════════════════════════════════════════════════════
// 1. REGISTER FOR EVENT
//    Route: POST /api/registrations/:eventId
//    Access: PARTICIPANT only (protect + authorizeRoles)
// ═══════════════════════════════════════════════════════════════════════════════
const registerForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const user_id = req.user.id;                          // JWT se — trusted source
        const { ticket_count = 1, phone_number = null } = req.body;

        // ── 1. Event exist karta hai? Aur kya woh PUBLISHED hai? ──────────────
        // Sirf PUBLISHED events pe register karna chahiye — DRAFT ya CANCELLED nahi.
        const [events] = await db.query(
            'SELECT id, title, capacity, status FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const event = events[0];

        // ── Event status check ────────────────────────────────────────────────
        // CANCELLED events pe registration band hai — DRAFT aur PUBLISHED dono chalte hain.
        // Kyun DRAFT bhi allow kiya? Organizer preview mode mein test kar sake.
        // Production mein sirf PUBLISHED check karna chahiye.
        if (event.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Registrations are closed. This event has been cancelled.'
            });
        }

        // ── 2. Already registered? (Double Registration Check) ────────────────
        // DB mein UNIQUE KEY already hai, lekin cleaner error message ke liye pehle check karo.
        const [existing] = await db.query(
            'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
            [user_id, eventId]
        );

        if (existing.length > 0) {
            // Agar pehle cancel kiya tha toh alag message
            const msg = existing[0].status === 'CANCELLED'
                ? 'You previously cancelled this registration. Please contact support to re-register.'
                : 'You are already registered for this event.';
            return res.status(400).json({ success: false, message: msg });
        }

        // ── 3. Capacity Check ─────────────────────────────────────────────────
        // Current registered count nikalo (sirf REGISTERED status — CANCELLED count nahi hogi)
        // ticket_count bhi consider karo — agar 3 tickets chahiye aur sirf 2 available hain
        const [capacityRows] = await db.query(
            `SELECT COALESCE(SUM(ticket_count), 0) as booked 
             FROM registrations 
             WHERE event_id = ? AND status = 'REGISTERED'`,
            [eventId]
        );

        const totalBooked = parseInt(capacityRows[0].booked);
        const availableSeats = event.capacity - totalBooked;

        if (availableSeats <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sorry, this event is fully booked.'
            });
        }

        if (ticket_count > availableSeats) {
            return res.status(400).json({
                success: false,
                message: `Only ${availableSeats} seat(s) remaining. You cannot book ${ticket_count} tickets.`
            });
        }

        // ── 4. Registration Code Generate Karo ────────────────────────────────
        // Unique code generate karo — collision ki probability negligible hai lekin check karo
        let registration_code;
        let isUnique = false;

        while (!isUnique) {
            registration_code = generateRegistrationCode();
            const [codeCheck] = await db.query(
                'SELECT id FROM registrations WHERE registration_code = ?',
                [registration_code]
            );
            isUnique = codeCheck.length === 0;
        }

        // ── 5. Registration Save Karo ─────────────────────────────────────────
        const [result] = await db.query(
            `INSERT INTO registrations (user_id, event_id, ticket_count, phone_number, registration_code, status)
             VALUES (?, ?, ?, ?, ?, 'REGISTERED')`,
            [user_id, eventId, ticket_count, phone_number || null, registration_code]
        );

        // ── 6. Nai registration fetch karke return karo ───────────────────────
        const [newReg] = await db.query(
            `SELECT r.id, r.ticket_count, r.phone_number, r.registration_code,
                    r.status, r.registered_at,
                    e.title as event_title, e.event_date, e.venue
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             WHERE r.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: `Successfully registered for "${event.title}"!`,
            data: newReg[0]
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 2. CANCEL MY REGISTRATION
//    Route: PUT /api/registrations/:id/cancel
//    Access: PARTICIPANT (sirf apni registration cancel kar sakta hai)
// ═══════════════════════════════════════════════════════════════════════════════
const cancelMyRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // ── Registration dhundo + Ownership check ─────────────────────────────
        // Kyun ownership check? Koi bhi kisi ka bhi registration ID dal kar cancel na kare.
        const [registrations] = await db.query(
            'SELECT id, user_id, status FROM registrations WHERE id = ?',
            [id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        const registration = registrations[0];

        // Ownership: sirf khud ki registration cancel ho sakti hai
        if (registration.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own registrations.'
            });
        }

        // Already cancelled? Idempotency check — same action dobara karna harmless hona chahiye
        if (registration.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'This registration is already cancelled.'
            });
        }

        // ── Soft Cancel — status update karo, row delete nahi karo ───────────
        // Kyun soft delete/cancel? History rakhni hai — attendance, analytics ke liye
        await db.query(
            "UPDATE registrations SET status = 'CANCELLED' WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Your registration has been cancelled successfully.'
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 3. GET MY REGISTRATIONS
//    Route: GET /api/registrations/my
//    Access: PARTICIPANT (apni sab registrations dekhe)
// ═══════════════════════════════════════════════════════════════════════════════
const getMyRegistrations = async (req, res, next) => {
    try {
        const user_id = req.user.id;

        // JOIN karo events table se taake event details bhi aayein ek hi query mein
        // DRY: N+1 queries avoid karo — ek JOIN zyada efficient hai
        const [registrations] = await db.query(
            `SELECT 
                r.id, r.ticket_count, r.phone_number, r.registration_code,
                r.status, r.registered_at,
                e.id       as event_id,
                e.title    as event_title,
                e.event_date,
                e.start_time,
                e.venue,
                e.category,
                e.status   as event_status
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             WHERE r.user_id = ?
             ORDER BY r.registered_at DESC`,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            data: registrations
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 4. GET EVENT CAPACITY (Public — no auth required)
//    Route: GET /api/registrations/event/:eventId/capacity
//    Access: Public (login zaroorat nahi — capacity info sensitive nahi hai)
//
// Kyun alag function? Single Responsibility — sirf capacity info chahiye,
// puri registration list nahi. Frontend modal isko mount hote hi call karta hai.
// ═══════════════════════════════════════════════════════════════════════════════
const getEventCapacity = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        // Event exist karta hai? Capacity bhi nikalo ek hi query mein
        const [events] = await db.query(
            'SELECT id, capacity FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Kitne seats abhi booked hain (CANCELLED registrations count nahi hongi)
        const [capacityRows] = await db.query(
            `SELECT COALESCE(SUM(ticket_count), 0) as booked
             FROM registrations
             WHERE event_id = ? AND status = 'REGISTERED'`,
            [eventId]
        );

        const booked = parseInt(capacityRows[0].booked);
        const total  = events[0].capacity;

        return res.status(200).json({
            success: true,
            data: {
                booked,                        // Abhi kitne seats booked hain
                total,                         // Event ki total capacity
                available: total - booked,     // Kitni seats baaki hain
                isFull: booked >= total        // Event full hai ya nahi
            }
        });

    } catch (error) {
        next(error);
    }
};


module.exports = { registerForEvent, cancelMyRegistration, getMyRegistrations, getEventCapacity };


