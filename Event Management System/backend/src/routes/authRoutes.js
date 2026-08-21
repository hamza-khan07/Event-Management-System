const express = require('express');
const router = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ─── Public Routes (login nahi chahiye) ────────────────────────
router.post('/register', register);
router.post('/login', login);

// ─── Protected Routes (login zaroori hai) ──────────────────────
// protect middleware pehle chalega, phir controller
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;

