// backend/src/routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    createEvent,
    getMyEvents,
    updateEventStatus,
    updateEvent,
    deleteEvent,
    getPublicEvents,
    getPublicEventById
} = require('../controllers/eventController');
const validate = require('../middleware/validateMiddleware');
const { updateEventSchema } = require('../validations/eventValidation');

// ─── Public Routes (no auth) ──────────────────────────────────────────────────
// ⚠️ IMPORTANT: Yeh routes /my-events aur /:id se PEHLE likhne zaroori hain.
// Kyun? Express top-to-bottom match karta hai. Agar /:id pehle hota to
// "public" string bhi ek ID samajh leta aur galat controller chalta.

// GET /api/events/public            → Sab published events (landing + all events page)
// GET /api/events/public/:id        → Single event detail page
router.get('/public', getPublicEvents);
router.get('/public/:id', getPublicEventById);

// ─── Protected Routes (ORGANIZER only) ───────────────────────────────────────
// POST /api/events/create         → Event create
// GET  /api/events/my-events      → Apni company ki events list
// PUT  /api/events/:id/status     → Event status change: DRAFT/PUBLISHED/CANCELLED
// PUT  /api/events/:id            → Event details update
// DELETE /api/events/:id          → Event hard delete (sirf DRAFT)

router.post('/create', protect, authorizeRoles('ORGANIZER'), createEvent);
router.get('/my-events', protect, authorizeRoles('ORGANIZER'), getMyEvents);
router.put('/:id/status', protect, authorizeRoles('ORGANIZER'), updateEventStatus);
router.put('/:id', protect, authorizeRoles('ORGANIZER'), validate(updateEventSchema, 'body'), updateEvent);
router.delete('/:id', protect, authorizeRoles('ORGANIZER'), deleteEvent);

module.exports = router;
