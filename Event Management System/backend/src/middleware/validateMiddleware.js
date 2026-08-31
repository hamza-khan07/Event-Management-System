// backend/src/middleware/validateMiddleware.js
const { ZodError } = require('zod');

// ─────────────────────────────────────────────────────────────────
// ZOD VALIDATION MIDDLEWARE
// Kyun: Controllers mein validation (if-else) likhne se controller
// messy ho jata hai. Yeh middleware Zod schema accept karega aur
// request data (body, query, params) validate karega.
// Agar validation fail hui to 400 response de dega.
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
                // Zod mein issues array hoti hai (error.issues)
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
