// backend/src/routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createEvent, getMyEvents, updateEventStatus, updateEvent, deleteEvent } = require('../controllers/eventController');
const validate = require('../middleware/validateMiddleware');
const { updateEventSchema } = require('../validations/eventValidation');

// POST /api/events/create         → Event create (ORGANIZER only)
// GET  /api/events/my-events      → Apni company ki events list (ORGANIZER only)
// PUT  /api/events/:id/status     → Event status change: DRAFT/PUBLISHED/CANCELLED

router.post('/create', protect, authorizeRoles('ORGANIZER'), createEvent);
router.get('/my-events', protect, authorizeRoles('ORGANIZER'), getMyEvents);
router.put('/:id/status', protect, authorizeRoles('ORGANIZER'), updateEventStatus);
router.put('/:id', protect, authorizeRoles('ORGANIZER'), validate(updateEventSchema, 'body'), updateEvent);
router.delete('/:id', protect, authorizeRoles('ORGANIZER'), deleteEvent);

module.exports = router;
