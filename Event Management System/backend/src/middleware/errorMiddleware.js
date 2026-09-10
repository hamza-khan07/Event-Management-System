// backend/src/middleware/errorMiddleware.js

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Responsibility: Catch all unhandled application errors and return
// a consistent JSON error response structure instead of manual try/catch
// in every controller.
// ─────────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
    console.error('🔥 [Global Error Handler]:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Include stack trace only in development environment
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
