const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.js');

// ─── Helper: Set JWT in HTTP-Only Cookie ───────────────────────
/**
 * Signs a JWT token and sets it in an HTTP-only cookie.
 * HTTP-only ensures JavaScript cannot read the cookie (XSS protection).
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
        httpOnly: true,          // Prevents client-side JS access
        secure: false,           // Set to true in production with HTTPS
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

        // ── Hash Password ──
        // bcrypt.hash with salt rounds = 12
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── Insert User ──
        // SECURITY RULE: Public registrations are strictly created with role 'PARTICIPANT'.
        // Roles like PRODUCT_MANAGER and ORGANIZER cannot be self-assigned publicly.
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), hashedPassword, 'PARTICIPANT', null]
        );

        // ── Safe Response (excluding password) ──
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

        // ── Find User by Email ──
        const [users] = await db.query(
            'SELECT id, company_id, name, email, password, role, status FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        // ── User Not Found ──
        // Return generic message to avoid disclosing user existence (security best practice)
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // ── Verify Password ──
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // ── Check Account Status ──
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // ── Issue JWT Cookie ──
        sendTokenCookie(res, user);

        // ── Return Sanitized User Info ──
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
    // Clear the authentication cookie
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
        // req.user is attached by authMiddleware
        // Query fresh data from DB to verify current state
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

        // Check if account was suspended after token issuance
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
