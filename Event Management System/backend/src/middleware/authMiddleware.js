const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * 
 * Har protected route se pehle ye chalega.
 * Kaam: Cookie se JWT token nikalna, verify karna,
 *       aur user info ko req.user mein rakhna.
 */
const protect = (req, res, next) => {
    try {
        // 1. Cookie se token nikalo
        const token = req.cookies.token;

        // 2. Agar token hai hi nahi — unauthorized
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please log in.'
            });
        }

        // 3. Token verify karo JWT_SECRET ke saath
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Decoded user info request mein attach karo
        //    (controllers mein req.user se access kar sakte hain)
        req.user = decoded;

        // 5. Aage jaane do (next route/controller chalao)
        next();

    } catch (error) {
        // Token invalid ya expired hai
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.'
        });
    }
};

/**
 * Role Authorization Middleware
 * 
 * Ye middleware tab chalega jab 'protect' pass ho jayega (yaani user logged in hai).
 * Isay hum batayenge ke kon kon se roles is route ko access kar sakte hain.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user humein 'protect' middleware se mila hai
        // Agar user ka role un roles mein nahi hai jo humne allow kiye hain
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access Denied. Your role (${req.user.role}) is not authorized to access this route.`
            });
        }

        // Agar role match kar gaya, toh aagay (controller ki taraf) jaane do
        next();
    };
};

// Dono ko export kar dein
module.exports = { protect, authorizeRoles };
