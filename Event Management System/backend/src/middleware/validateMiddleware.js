// backend/src/middleware/validateMiddleware.js
const { ZodError } = require('zod');

// ─────────────────────────────────────────────────────────────────
// ZOD VALIDATION MIDDLEWARE
// Responsibility: Validates incoming request data (body, query, params)
// against a given Zod schema and returns a structured 400 Bad Request
// response if validation fails, keeping controllers clean.
// ─────────────────────────────────────────────────────────────────
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            // Zod's parse method throws an error if validation fails
            // It also strips out unknown keys and does type coercion (if configured)
            req[source] = schema.parse(req[source]);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Extract error messages from Zod issues array
                const issues = error.issues || error.errors || [];
                const errorMessage = issues.map(err => err.message).join(', ') || error.message;
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }
            // If it's some other unexpected error, pass it to global handler
            next(error);
        }
    };
};

module.exports = validate;
