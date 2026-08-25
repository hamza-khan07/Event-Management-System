
const express = require('express');
const router = express.Router();
const { getPMStats } = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Yeh APIs protected (mehfooz) honi chahiye.
// 1. `protect`: Check karega k user logged in hai (uske pass token hai).
// 2. `authorizeRoles`: Check karega k us user ka role 'PRODUCT_MANAGER' ho warna access deny kar dega.
router.get(
    '/pm-stats',
    protect,
    authorizeRoles('PRODUCT_MANAGER'),
    getPMStats
);

module.exports = router;
