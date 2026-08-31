// backend/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { companySchema, updateCompanyStatusSchema, addOrganizerSchema } = require('../validations/companyValidation');
const { getAllCompanies, getCompanyById, updateCompanyStatus, createCompany, updateCompany, addOrganizer } = require('../controllers/companyController');

// GET    /api/companies              → saari companies (search + pagination)
// GET    /api/companies/:id          → ek company ki detail
// POST   /api/companies              → nayi company create
// PUT    /api/companies/:id/status   → status change (activate/suspend)
// PUT    /api/companies/:id          → full info update
// POST   /api/companies/:id/organizers → company mein organizer add karo

router.get('/', protect, authorizeRoles('PRODUCT_MANAGER'), getAllCompanies);
router.get('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), getCompanyById);
router.post('/', protect, authorizeRoles('PRODUCT_MANAGER'), validate(companySchema, 'body'), createCompany);
router.put('/:id/status', protect, authorizeRoles('PRODUCT_MANAGER'), validate(updateCompanyStatusSchema, 'body'), updateCompanyStatus);
router.put('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), validate(companySchema, 'body'), updateCompany);
router.post('/:id/organizers', protect, authorizeRoles('PRODUCT_MANAGER'), validate(addOrganizerSchema, 'body'), addOrganizer);

module.exports = router;
