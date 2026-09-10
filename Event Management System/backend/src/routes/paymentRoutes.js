const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { createJazzCashPayment, jazzCashReturn, processMockPayment } = require("../controllers/paymentController");

// POST /api/payments/jazzcash/create
// → Accessible only to authenticated PARTICIPANT users
router.post(
    "/jazzcash/create",
    protect,
    authorizeRoles('PARTICIPANT'),
    createJazzCashPayment
);

// POST /api/payments/jazzcash/return
// → PUBLIC: JazzCash posts directly to this callback endpoint
// → Secured via hash verification inside the controller
router.post("/jazzcash/return", jazzCashReturn);

// POST /api/payments/mock/process
// → Simulated payment gateway for development testing
// → PARTICIPANT only — JWT protected
router.post(
    "/mock/process",
    protect,
    authorizeRoles('PARTICIPANT'),
    processMockPayment
);

module.exports = router;
