// backend/src/middleware/errorMiddleware.js

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Kyun: Har controller mein try-catch laga kar manual 500 error 
// bhejna scalable nahi hai. Yeh middleware sab unhandled errors ko
// pakre ga aur ek consistent JSON format mein response dega.
// ─────────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
    console.error('🔥 [Global Error Handler]:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Development environment mein stack trace bhejna helpful hai
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
