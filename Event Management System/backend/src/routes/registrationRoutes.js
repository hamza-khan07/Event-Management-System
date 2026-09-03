// backend/src/routes/registrationRoutes.js
//
// RESPONSIBILITY: Registration ke sab HTTP routes define karo.
//
// Middleware chain (left to right):
//   protect        → kya user logged in hai? (JWT check)
//   authorizeRoles → kya user ka role allowed hai?
//   validate       → kya request body valid hai? (Zod schema)
//   controller     → actual business logic

const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerForEventSchema } = require('../validations/registrationValidation');
const {
    registerForEvent,
    cancelMyRegistration,
    getMyRegistrations,
    getEventCapacity        // public: registered count + total capacity
} = require('../controllers/registrationController');

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/registrations/:eventId
// → Ek event ke liye register karo
// → Sirf PARTICIPANT role allowed hai (ORGANIZER apne hi event pe register nahi karta)
router.post(
    '/:eventId',
    protect,
    authorizeRoles('PARTICIPANT'),
    validate(registerForEventSchema, 'body'),
    registerForEvent
);

// GET /api/registrations/my
// → Apni sab registrations dekho
// IMPORTANT: Yeh route '/:eventId' se PEHLE likhna zaroori hai.
// Kyun? Express top-to-bottom match karta hai — agar /:eventId pehle hota toh
// "my" ko bhi eventId samajh leta aur galat controller chalta.
router.get(
    '/my',
    protect,
    authorizeRoles('PARTICIPANT'),
    getMyRegistrations
);

// GET /api/registrations/event/:eventId/capacity
// → Event ki current capacity info (public — login nahi chahiye)
// → Frontend modal mein "X / Y registered" dikhane ke liye
// Kyun public? Capacity info sensitive nahi hai — koi bhi event detail page dekh sakta hai
router.get('/event/:eventId/capacity', getEventCapacity);

// PUT /api/registrations/:id/cancel
// → Apni registration cancel karo (soft cancel — status = CANCELLED)
router.put(
    '/:id/cancel',
    protect,
    authorizeRoles('PARTICIPANT'),
    cancelMyRegistration
);

module.exports = router;
