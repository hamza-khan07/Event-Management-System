const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { createJazzCashPayment, jazzCashReturn, processMockPayment } = require("../controllers/paymentController");

// POST /api/payments/jazzcash/create
// → Sirf logged-in PARTICIPANT access kar sake
router.post(
    "/jazzcash/create",
    protect,
    authorizeRoles('PARTICIPANT'),
    createJazzCashPayment
);

// POST /api/payments/jazzcash/return
// → PUBLIC: JazzCash directly is URL par POST karta hai
// → Koi auth nahi — hash verification controller mein hai
router.post("/jazzcash/return", jazzCashReturn);

// POST /api/payments/mock/process
// → Simulated/Fake payment gateway — development ke liye
// → PARTICIPANT only — JWT protected
router.post(
    "/mock/process",
    protect,
    authorizeRoles('PARTICIPANT'),
    processMockPayment
);

module.exports = router;
