const express = require('express');
const router = express.Router();
const { getPMStats } = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Protected Dashboard API endpoints:
// 1. `protect`: Verifies that the user is authenticated with a valid token.
// 2. `authorizeRoles`: Restricts access to users with the 'PRODUCT_MANAGER' role.
router.get(
    '/pm-stats',
    protect,
    authorizeRoles('PRODUCT_MANAGER'),
    getPMStats
);

module.exports = router;
