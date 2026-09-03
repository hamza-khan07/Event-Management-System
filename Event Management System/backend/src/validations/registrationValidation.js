// backend/src/validations/registrationValidation.js
//
// Kyun Zod? Controllers mein if-else validation messy hoti hai.
// Zod schema ek jagah define karo, middleware se use karo — DRY principle.

const { z } = require('zod');

// ─── REGISTER FOR EVENT ────────────────────────────────────────────────────────
// Sirf 2 fields user se layna hain — baaki (user_id, event_id) backend handle karega.
const registerForEventSchema = z.object({
    // ticket_count: 1 se 10 tak — zyada ek user ko nahi milne chahiye (business rule)
    ticket_count: z.coerce
        .number({ invalid_type_error: 'Ticket count must be a number.' })
        .int('Ticket count must be a whole number.')
        .min(1, 'At least 1 ticket required.')
        .max(10, 'Maximum 10 tickets per registration.'),

    // phone_number: optional hai — Pakistani number format accept karo
    // agar diya toh valid hona chahiye (7-15 digits, with optional + prefix)
    phone_number: z.string()
        .regex(/^[+]?[\d\s\-]{7,15}$/, 'Invalid phone number format.')
        .optional()
        .nullable()
});

module.exports = { registerForEventSchema };
