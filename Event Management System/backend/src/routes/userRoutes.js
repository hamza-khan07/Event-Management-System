// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsersByRole, getUserById, updateUserStatus } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { updateCompanyStatusSchema } = require('../validations/companyValidation'); // Reuse status schema

// All user management routes are restricted to PRODUCT_MANAGER
// GET  /api/users?role=ORGANIZER   → List organizers (with search + pagination)
// GET  /api/users?role=PARTICIPANT → List participants
// GET  /api/users/:id              → Get single user details
// PUT  /api/users/:id/status       → Update user status (ACTIVE / SUSPENDED)

router.get('/', protect, authorizeRoles('PRODUCT_MANAGER'), getUsersByRole);
router.get('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), getUserById);
router.put('/:id/status', protect, authorizeRoles('PRODUCT_MANAGER'), validate(updateCompanyStatusSchema, 'body'), updateUserStatus);

module.exports = router;
