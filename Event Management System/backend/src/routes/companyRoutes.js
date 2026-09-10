// backend/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { companySchema, updateCompanyStatusSchema, addOrganizerSchema } = require('../validations/companyValidation');
const { getAllCompanies, getCompanyById, updateCompanyStatus, createCompany, updateCompany, addOrganizer } = require('../controllers/companyController');

// GET    /api/companies                → List all companies (search + pagination)
// GET    /api/companies/:id            → Get single company details
// POST   /api/companies                → Create a new company
// PUT    /api/companies/:id/status     → Update company status (ACTIVE / SUSPENDED)
// PUT    /api/companies/:id            → Update full company profile
// POST   /api/companies/:id/organizers → Add a new organizer to a company

router.get('/', protect, authorizeRoles('PRODUCT_MANAGER'), getAllCompanies);
router.get('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), getCompanyById);
router.post('/', protect, authorizeRoles('PRODUCT_MANAGER'), validate(companySchema, 'body'), createCompany);
router.put('/:id/status', protect, authorizeRoles('PRODUCT_MANAGER'), validate(updateCompanyStatusSchema, 'body'), updateCompanyStatus);
router.put('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), validate(companySchema, 'body'), updateCompany);
router.post('/:id/organizers', protect, authorizeRoles('PRODUCT_MANAGER'), validate(addOrganizerSchema, 'body'), addOrganizer);

module.exports = router;
