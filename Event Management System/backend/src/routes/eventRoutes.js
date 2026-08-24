const express = require('express');
const router = express.Router();
// Dono middlewares import karein
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createEvent } = require('../controllers/eventController');

// 1. Pehle 'protect' check karega ke user login hai.
// 2. Phir 'authorizeRoles' check karega ke user MANAGER ya ORGANIZER hai.
// 3. Agar dono paas hue toh 'createEvent' chalega.
router.post(
    '/create',
    protect,
    authorizeRoles('PRODUCT_MANAGER', 'ORGANIZER'),
    createEvent
);

module.exports = router;
