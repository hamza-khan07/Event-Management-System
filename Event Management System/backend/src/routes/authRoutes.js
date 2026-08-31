const express = require('express');
const router = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerSchema, loginSchema } = require('../validations/authValidation');

// ─── Public Routes (login nahi chahiye) ────────────────────────
router.post('/register', validate(registerSchema, 'body'), register);
router.post('/login', validate(loginSchema, 'body'), login);

// ─── Protected Routes (login zaroori hai) ──────────────────────
// protect middleware pehle chalega, phir controller
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
