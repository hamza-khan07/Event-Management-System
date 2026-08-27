// backend/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { getAllCompanies, getCompanyById, updateCompanyStatus } = require('../controllers/companyController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Tamam company routes sirf PM ke liye protected hain
// GET  /api/companies          → saari companies (search + pagination)
// GET  /api/companies/:id      → ek company ki detail
// PUT  /api/companies/:id/status → status change (activate/suspend)

router.get('/', protect, authorizeRoles('PRODUCT_MANAGER'), getAllCompanies);
router.get('/:id', protect, authorizeRoles('PRODUCT_MANAGER'), getCompanyById);
router.put('/:id/status', protect, authorizeRoles('PRODUCT_MANAGER'), updateCompanyStatus);

module.exports = router;
