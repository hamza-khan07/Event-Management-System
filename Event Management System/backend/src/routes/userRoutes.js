// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsersByRole, getUserById, updateUserStatus } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { updateCompanyStatusSchema } = require('../validations/companyValidation'); // Reuse status schema

// Tamam user routes sirf PM ke liye protected hain
// GET  /api/users?role=ORGANIZER   → organizer list (search + pagination)
// GET  /api/users?role=PARTICIPANT → participant list
// GET  /api/users/:id              → single user detail
// PUT  /api/users/:id/status       → status update

router.get('/', protect, authorizeRoles('PRODUCT_MANAGER'), getUsersByRole);
router.get('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), getUserById);
router.put('/:id/status', protect, authorizeRoles('PRODUCT_MANAGER'), validate(updateCompanyStatusSchema, 'body'), updateUserStatus);

module.exports = router;
