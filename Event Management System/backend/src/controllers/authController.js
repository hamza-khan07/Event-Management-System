const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.js');

// ─── Helper: JWT Cookie Set Karna ─────────────────────────────
/**
 * JWT token banao aur HTTP-only cookie mein set karo.
 * HTTP-only = JavaScript is cookie ko access nahi kar sakti (XSS safe)
 */
const sendTokenCookie = (res, user) => {
    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    const expireHours = parseInt(process.env.JWT_EXPIRES_IN, 10) || 24;

    res.cookie('token', token, {
        httpOnly: true,          // JavaScript is cookie ko read nahi kar sakti
        secure: false,           // Development mein false (HTTPS nahi hai), production mein true
        sameSite: 'lax',        // CSRF protection
        maxAge: expireHours * 60 * 60 * 1000
    });

    return token;
};

// ═══════════════════════════════════════════════════════════════
// REGISTER
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Manual validation replaced by Zod Validation Middleware

        // ── Duplicate Email Check ──
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // ── Password Hash Karo ──
        // bcrypt.hash(password, saltRounds) — saltRounds=12 means very secure
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── User Insert Karo ──
        // IMPORTANT: Role is always 'PARTICIPANT' for public registration
        // PRODUCT_MANAGER aur ORGANIZER public nahi bana sakte — security rule
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), hashedPassword, 'PARTICIPANT', null]
        );

        // ── Safe Response (NO password in response) ──
        return res.status(201).json({
            success: true,
            message: 'Account created successfully. Please log in.',
            user: {
                id: result.insertId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                role: 'PARTICIPANT'
            }
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Manual validation replaced by Zod Validation Middleware

        // ── User Dhundo by Email ──
        const [users] = await db.query(
            'SELECT id, company_id, name, email, password, role, status FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        // ── User nahi mila ──
        // NOTE: Same message as wrong password — do not reveal which one is wrong (security)
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // ── Password Compare Karo ──
        // bcrypt.compare(entered, storedHash) — returns true or false
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // ── Account Status Check ──
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // ── JWT Token Banao aur Cookie Mein Set Karo ──
        sendTokenCookie(res, user);

        // ── Safe User Info Return Karo (NO password) ──
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company_id: user.company_id
            }
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════
// LOGOUT
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════
const logout = (req, res) => {
    // Cookie clear karo (same name, options match honi chahiye)
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
};


// ═══════════════════════════════════════════════════════════════
// GET CURRENT USER (ME)
// GET /api/auth/me
// ═══════════════════════════════════════════════════════════════
const getMe = async (req, res, next) => {
    try {
        // req.user already attached by authMiddleware
        // Fresh data fetch from DB (in case something changed)
        const [users] = await db.query(
            'SELECT id, company_id, name, email, role, status, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const user = users[0];

        // Check if account was suspended after token was issued
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended.'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                status: user.status,
                created_at: user.created_at
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, getMe };
