// backend/src/validations/eventValidation.js
const { z } = require('zod');

// ─────────────────────────────────────────────────────────────────
// CREATE EVENT SCHEMA
// Yahan hum strict validation rules define karte hain Zod ke saath.
// ─────────────────────────────────────────────────────────────────

// Date validation helper for "min today"
const dateStringOrObject = z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date({
    required_error: "Event date is required.",
    invalid_type_error: "Invalid date format."
}).min(new Date(new Date().setHours(0, 0, 0, 0)), "Event date cannot be in the past."));

const createEventSchema = z.object({
    title: z.string({ required_error: 'Event title is required.' })
        .trim()
        .min(3, 'Event title must be at least 3 characters.'),

    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    venue: z.string().optional().nullable(),

    event_date: dateStringOrObject,

    start_time: z.string({ required_error: 'Start time is required.' })
        .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid start time format. Use HH:MM or HH:MM:SS.'),

    end_time: z.string({ required_error: 'End time is required.' })
        .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid end time format. Use HH:MM or HH:MM:SS.'),

    // Coerce converts strings like "100" to number 100
    capacity: z.coerce.number({
        required_error: 'Capacity is required.',
        invalid_type_error: 'Capacity must be a valid number.'
    }).int().min(1, 'Capacity must be at least 1.'),

    // price: "Free", "PKR 2,500" — VARCHAR isliye kyunke "Free" bhi valid value hai
    price: z.string().optional().nullable(),

    // image_url: event ki banner image — agar URL diya toh valid hona chahiye
    image_url: z.string().url('Invalid image URL format.').optional().nullable(),

    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT')
});

// ─────────────────────────────────────────────────────────────────
// UPDATE EVENT STATUS SCHEMA
// ─────────────────────────────────────────────────────────────────
const updateEventStatusSchema = z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED'], {
        required_error: 'Status is required.',
        invalid_type_error: 'Invalid status. Allowed: DRAFT, PUBLISHED, CANCELLED'
    })
});

// File ke aakhir mein export se pehle yeh line add karein:
// .partial() lagane se saari fields optional ho jati hain (PUT request k liye best hy)
const updateEventSchema = createEventSchema.partial();

module.exports = {
    createEventSchema,
    updateEventStatusSchema,
    updateEventSchema
};
