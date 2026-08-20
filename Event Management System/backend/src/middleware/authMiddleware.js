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

module.exports = { protect };
