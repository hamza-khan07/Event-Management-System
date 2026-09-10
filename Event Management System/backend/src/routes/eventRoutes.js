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

// ─── Public Routes (No authentication required) ───────────────────────────────
// NOTE: These routes must be defined BEFORE parameter routes like /:id
// to avoid matching strings like 'public' as an event ID.

// GET /api/events/public            → Get all published events (landing & all events pages)
// GET /api/events/public/:id        → Get details for a single published event
router.get('/public', getPublicEvents);
router.get('/public/:id', getPublicEventById);

// ─── Protected Routes (ORGANIZER only) ───────────────────────────────────────
// POST   /api/events/create         → Create a new event
// GET    /api/events/my-events      → List events belonging to organizer's company
// PUT    /api/events/:id/status     → Update event status (DRAFT/PUBLISHED/CANCELLED)
// PUT    /api/events/:id            → Update event details
// DELETE /api/events/:id            → Delete event (DRAFT status only)

router.post('/create', protect, authorizeRoles('ORGANIZER'), createEvent);
router.get('/my-events', protect, authorizeRoles('ORGANIZER'), getMyEvents);
router.put('/:id/status', protect, authorizeRoles('ORGANIZER'), updateEventStatus);
router.put('/:id', protect, authorizeRoles('ORGANIZER'), validate(updateEventSchema, 'body'), updateEvent);
router.delete('/:id', protect, authorizeRoles('ORGANIZER'), deleteEvent);

module.exports = router;
