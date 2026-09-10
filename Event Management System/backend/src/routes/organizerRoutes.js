// backend/src/routes/organizerRoutes.js

const express = require('express');
const router = express.Router();
const { getMyCompany, updateMyCompany, getOrganizerOverviewStats, getMyParticipants } = require('../controllers/organizerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { companySchema } = require('../validations/companyValidation');

// ─────────────────────────────────────────────────────────────
// Route protection configuration:
// 1. protect         → Requires authenticated session (valid JWT)
// 2. authorizeRoles  → Restricts access exclusively to 'ORGANIZER'
//
// GET  /api/organizer/overview-stats → Analytics overview for organizer dashboard
// GET  /api/organizer/my-company     → Retrieve company details for current organizer
// PUT  /api/organizer/my-company     → Update company details for current organizer
// ─────────────────────────────────────────────────────────────

router.get('/overview-stats',   protect, authorizeRoles('ORGANIZER'), getOrganizerOverviewStats);

router.get('/my-company',       protect, authorizeRoles('ORGANIZER'), getMyCompany);
router.put('/my-company',       protect, authorizeRoles('ORGANIZER'), validate(companySchema, 'body'), updateMyCompany);

// GET /api/organizer/my-participants → List registered participants (supports filters + pagination)
router.get('/my-participants',  protect, authorizeRoles('ORGANIZER'), getMyParticipants);

module.exports = router;
