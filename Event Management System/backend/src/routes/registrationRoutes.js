// backend/src/routes/registrationRoutes.js
//
// RESPONSIBILITY: Define HTTP routes for event registrations.
//
// Middleware chain (left to right):
//   protect        → Verify user session (JWT authentication)
//   authorizeRoles → Ensure user role is permitted
//   validate       → Validate request body against Zod schema
//   controller     → Execute business logic

const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerForEventSchema } = require('../validations/registrationValidation');
const {
    registerForEvent,
    cancelMyRegistration,
    getMyRegistrations,
    getEventCapacity
} = require('../controllers/registrationController');

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/registrations/:eventId
// → Register for an event
// → Restricted to PARTICIPANT role
router.post(
    '/:eventId',
    protect,
    authorizeRoles('PARTICIPANT'),
    validate(registerForEventSchema, 'body'),
    registerForEvent
);

// GET /api/registrations/my
// → View current user's registrations
// NOTE: Defined before '/:eventId' to avoid path collision
router.get(
    '/my',
    protect,
    authorizeRoles('PARTICIPANT'),
    getMyRegistrations
);

// GET /api/registrations/event/:eventId/capacity
// → Get current registration count and capacity (public - no auth required)
// → Used by event modal to display "X / Y registered"
router.get('/event/:eventId/capacity', getEventCapacity);

// PUT /api/registrations/:id/cancel
// → Cancel user registration (soft cancellation setting status = CANCELLED)
router.put(
    '/:id/cancel',
    protect,
    authorizeRoles('PARTICIPANT'),
    cancelMyRegistration
);

module.exports = router;
