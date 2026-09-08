// backend/src/routes/organizerRoutes.js

const express = require('express');
const router = express.Router();
const { getMyCompany, updateMyCompany, getOrganizerOverviewStats, getMyParticipants } = require('../controllers/organizerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { companySchema } = require('../validations/companyValidation');

// ─────────────────────────────────────────────────────────────
// Tamam routes par double protection:
// 1. protect         → Login hona zaroori (JWT valid ho)
// 2. authorizeRoles  → Sirf ORGANIZER role allowed
//
// GET  /api/organizer/overview-stats → analytics overview
// GET  /api/organizer/my-company     → apni company ki info
// PUT  /api/organizer/my-company     → apni company update karo
// GET  /api/organizer/my-profile     → apna profile
// ─────────────────────────────────────────────────────────────

router.get('/overview-stats',   protect, authorizeRoles('ORGANIZER'), getOrganizerOverviewStats);

router.get('/my-company',       protect, authorizeRoles('ORGANIZER'), getMyCompany);
router.put('/my-company',       protect, authorizeRoles('ORGANIZER'), validate(companySchema, 'body'), updateMyCompany);

// GET /api/organizer/my-participants — participants ki list (with filters + pagination)
router.get('/my-participants',  protect, authorizeRoles('ORGANIZER'), getMyParticipants);

module.exports = router;
