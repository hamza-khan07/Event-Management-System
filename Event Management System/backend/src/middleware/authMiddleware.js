const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * 
 * Runs before any protected route.
 * Responsibility: Extract JWT token from cookie, verify it,
 * and attach decoded user information to req.user.
 */
const protect = (req, res, next) => {
    try {
        // 1. Extract token from cookies
        const token = req.cookies.token;

        // 2. Reject request if no token is found
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please log in.'
            });
        }

        // 3. Verify token with JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach decoded user info to request (accessible in controllers via req.user)
        req.user = decoded;

        // 5. Proceed to next middleware/controller
        next();

    } catch (error) {
        // Invalid or expired token
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.'
        });
    }
};

/**
 * Role Authorization Middleware
 * 
 * Executes after 'protect' middleware succeeds (ensuring the user is authenticated).
 * Validates whether the user's role matches any of the allowed roles for the route.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is populated by 'protect' middleware
        // Deny access if user role is not in the allowed list
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access Denied. Your role (${req.user.role}) is not authorized to access this route.`
            });
        }

        // Proceed if role matches
        next();
    };
};

module.exports = { protect, authorizeRoles };
