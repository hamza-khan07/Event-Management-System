// backend/src/validations/registrationValidation.js
//
// Validation schema defined centrally via Zod for reusability (DRY).

const { z } = require('zod');

// ─── REGISTER FOR EVENT ────────────────────────────────────────────────────────
// Validates user-supplied input fields; system fields (user_id, event_id) are injected on the server.
const registerForEventSchema = z.object({
    // ticket_count: 1 to 10 tickets allowed per registration (business rule)
    ticket_count: z.coerce
        .number({ invalid_type_error: 'Ticket count must be a number.' })
        .int('Ticket count must be a whole number.')
        .min(1, 'At least 1 ticket required.')
        .max(10, 'Maximum 10 tickets per registration.'),

    // phone_number: Optional emergency contact number (7-15 digits, optional + prefix)
    phone_number: z.string()
        .regex(/^[+]?[\d\s\-]{7,15}$/, 'Invalid phone number format.')
        .optional()
        .nullable()
});

module.exports = { registerForEventSchema };
