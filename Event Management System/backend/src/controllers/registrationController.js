// backend/src/controllers/registrationController.js
//
// RESPONSIBILITY: Manage event registration operations.
//
// Functions:
//   1. registerForEvent     → POST /api/registrations/:eventId
//   2. cancelMyRegistration → PUT /api/registrations/:id/cancel
//   3. getMyRegistrations   → GET /api/registrations/my
//   4. getEventCapacity     → GET /api/registrations/event/:eventId/capacity
//
// Design Decisions:
//   - user_id is always derived from authenticated JWT (req.user.id), not route parameters.
//   - registration_code is generated securely on the server.

const db = require('../config/db');

// ─── Helper: Generate Unique Registration Code ────────────────────────────────
// Format: EVT-XXXX-XXXX (e.g., EVT-A3F2-K9P1)
const generateRegistrationCode = () => {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EVT-${part1}-${part2}`;
};


// ═══════════════════════════════════════════════════════════════════════════════
// 1. REGISTER FOR EVENT
//    Route: POST /api/registrations/:eventId
//    Access: PARTICIPANT only
// ═══════════════════════════════════════════════════════════════════════════════
const registerForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const user_id = req.user.id;
        const { ticket_count = 1, phone_number = null } = req.body;

        // ── 1. Check if event exists and is PUBLISHED ────────────────────────
        const [events] = await db.query(
            'SELECT id, title, capacity, status, price FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const event = events[0];

        // ── Verify event is open for registrations ───────────────────────────
        if (event.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Registrations are closed. This event has been cancelled.'
            });
        }

        // ── 2. Duplicate registration check ──────────────────────────────────
        const [existing] = await db.query(
            'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
            [user_id, eventId]
        );

        if (existing.length > 0) {
            const msg = existing[0].status === 'CANCELLED'
                ? 'You previously cancelled this registration. Please contact support to re-register.'
                : 'You are already registered for this event.';
            return res.status(400).json({ success: false, message: msg });
        }

        // ── 3. Capacity Check ─────────────────────────────────────────────────
        const [capacityRows] = await db.query(
            `SELECT COALESCE(SUM(ticket_count), 0) as booked 
             FROM registrations 
             WHERE event_id = ? AND status IN ('REGISTERED', 'PENDING')`,
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

        // ── 4. Calculate total amount ─────────────────────────────────────────
        const priceStr = event.price || 'Free';
        const isFree = !priceStr || 
                       priceStr.toLowerCase() === 'free' || 
                       priceStr === '0';

        let numericPrice = 0;
        if (!isFree) {
            numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        }
        const totalAmount = numericPrice * ticket_count;

        // ── 5. Generate unique registration code ─────────────────────────────
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

        // ── 6. Save registration record ───────────────────────────────────────
        // Free events are set to REGISTERED directly; paid events are set to PENDING until checkout
        const initialStatus = isFree ? 'REGISTERED' : 'PENDING';

        const [result] = await db.query(
            `INSERT INTO registrations (user_id, event_id, ticket_count, phone_number, registration_code, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, eventId, ticket_count, phone_number || null, registration_code, initialStatus]
        );

        // Pre-create pending payment record for paid events
        if (!isFree) {
            const txnRef = `T${result.insertId}${Date.now()}`;
            await db.query(
                `INSERT INTO payments (registration_id, transaction_id, amount, status)
                 VALUES (?, ?, ?, 'PENDING')
                 ON DUPLICATE KEY UPDATE
                     transaction_id = VALUES(transaction_id),
                     amount = VALUES(amount),
                     status = 'PENDING',
                     updated_at = NOW()`,
                [result.insertId, txnRef, totalAmount]
            );
        }

        // ── 7. Retrieve created registration details ─────────────────────────
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
            message: isFree
                ? `Successfully registered for "${event.title}"!`
                : `Registration created! Please complete payment to confirm your spot.`,
            data: newReg[0],
            requiresPayment: !isFree,
            amount: totalAmount,
            event_title: event.title
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 2. CANCEL MY REGISTRATION
//    Route: PUT /api/registrations/:id/cancel
//    Access: PARTICIPANT (users can only cancel their own registrations)
// ═══════════════════════════════════════════════════════════════════════════════
const cancelMyRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Verify registration ownership
        const [registrations] = await db.query(
            'SELECT id, user_id, status FROM registrations WHERE id = ?',
            [id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        const registration = registrations[0];

        if (registration.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own registrations.'
            });
        }

        // Idempotency check
        if (registration.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'This registration is already cancelled.'
            });
        }

        // Soft cancel — preserve historical records by updating status
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
//    Access: PARTICIPANT
// ═══════════════════════════════════════════════════════════════════════════════
const getMyRegistrations = async (req, res, next) => {
    try {
        const user_id = req.user.id;

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
//    Access: Public
// ═══════════════════════════════════════════════════════════════════════════════
const getEventCapacity = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        const [events] = await db.query(
            'SELECT id, capacity FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Count confirmed/registered seats
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
                booked,
                total,
                available: total - booked,
                isFull: booked >= total
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { registerForEvent, cancelMyRegistration, getMyRegistrations, getEventCapacity };
