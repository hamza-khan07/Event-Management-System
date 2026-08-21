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

// ─── Helper: Password Validation ──────────────────────────────
const validatePassword = (password) => {
    // Minimum 6 characters
    if (password.length < 6) {
        return 'Password must be at least 6 characters long.';
    }
    return null; // null means valid
};

// ─── Helper: Email Validation ─────────────────────────────────
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


// ═══════════════════════════════════════════════════════════════
// REGISTER
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════
const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // ── 1. Required Fields Check ──
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, password, confirmPassword.'
            });
        }

        // ── 2. Name Check ──
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters.'
            });
        }

        // ── 3. Email Format Check ──
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // ── 4. Password Strength Check ──
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        // ── 5. Password Match Check ──
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        // ── 6. Duplicate Email Check ──
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

        // ── 7. Password Hash Karo ──
        // bcrypt.hash(password, saltRounds) — saltRounds=12 means very secure
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── 8. User Insert Karo ──
        // IMPORTANT: Role is always 'PARTICIPANT' for public registration
        // PRODUCT_MANAGER aur ORGANIZER public nahi bana sakte — security rule
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), hashedPassword, 'PARTICIPANT', null]
        );

        // ── 9. Safe Response (NO password in response) ──
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
        console.error('Register error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again.'
        });
    }
};


// ═══════════════════════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ── 1. Required Fields Check ──
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // ── 2. Email Format Check ──
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // ── 3. User Dhundo by Email ──
        const [users] = await db.query(
            'SELECT id, company_id, name, email, password, role, status FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        // ── 4. User nahi mila ──
        // NOTE: Same message as wrong password — do not reveal which one is wrong (security)
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // ── 5. Password Compare Karo ──
        // bcrypt.compare(entered, storedHash) — returns true or false
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // ── 6. Account Status Check ──
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // ── 7. JWT Token Banao aur Cookie Mein Set Karo ──
        sendTokenCookie(res, user);

        // ── 8. Safe User Info Return Karo (NO password) ──
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
        console.error('Login error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again.'
        });
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
const getMe = async (req, res) => {
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
        console.error('GetMe error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
};


module.exports = { register, login, logout, getMe };
