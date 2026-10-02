// backend/src/validations/eventValidation.js
const { z } = require('zod');

// ─────────────────────────────────────────────────────────────────
// SHARED DATE PREPROCESSORS
// These helpers convert string or Date inputs into proper JS Date
// objects before handing them to Zod's .date() validator.
// ─────────────────────────────────────────────────────────────────

// Event date validator: must be today or in the future
const dateStringOrObject = z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date({
    required_error: 'Event date is required.',
    invalid_type_error: 'Invalid date format.'
}).min(new Date(new Date().setHours(0, 0, 0, 0)), 'Event date cannot be in the past.'));

// Registration deadline validator: accepts any valid date string/object.
// Cross-field validation (deadline <= event_date) is handled at the schema level below.
const deadlineDatePreprocess = z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date({
    required_error: 'Registration deadline is required.',
    invalid_type_error: 'Invalid registration deadline format.'
}));


// ─────────────────────────────────────────────────────────────────
// BASE EVENT OBJECT SHAPE
// Defined separately so we can call .partial() on it for the update
// schema WITHOUT hitting Zod's restriction on refining first.
// The cross-field refine() is applied AFTER .partial() where needed.
// ─────────────────────────────────────────────────────────────────
const baseEventShape = z.object({
    title: z.string({ required_error: 'Event title is required.' })
        .trim()
        .min(3, 'Event title must be at least 3 characters.'),

    description: z.string().optional().nullable(),
    category:    z.string().optional().nullable(),
    venue:       z.string().optional().nullable(),
    
    // Allow float numbers or numeric strings (stripped to undefined if not included in schema)
    latitude:    z.union([z.number(), z.string()]).optional().nullable(),
    longitude:   z.union([z.number(), z.string()]).optional().nullable(),

    event_date: dateStringOrObject,

    start_time: z.string({ required_error: 'Start time is required.' })
        .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid start time format. Use HH:MM or HH:MM:SS.'),

    end_time: z.string({ required_error: 'End time is required.' })
        .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid end time format. Use HH:MM or HH:MM:SS.'),

    // Registration cutoff date — required on create, optional on partial updates.
    // After this date + closing time, users cannot register for the event.
    // Cross-field rule (must be <= event_date) is enforced via .refine() below.
    registration_deadline: deadlineDatePreprocess,

    // Mandatory closing time on the deadline date.
    // Organizers must specify the exact time registration closes.
    registration_deadline_time: z.string({
        message: 'Registration closing time is required.'
    })
        .trim()
        .min(1, 'Registration closing time is required.')
        .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid closing time format. Use HH:MM or HH:MM:SS.'),

    // Coerce converts numeric string representations (e.g. "100") to integer 100
    capacity: z.coerce.number({
        required_error: 'Capacity is required.',
        invalid_type_error: 'Capacity must be a valid number.'
    }).int().min(1, 'Capacity must be at least 1.'),

    // price: "Free", "PKR 2,500" — stored as VARCHAR to accommodate labels and formatted amounts
    price: z.string().optional().nullable(),

    // image_url: event banner — must be a valid URL if provided
    image_url: z.string().url('Invalid image URL format.').optional().nullable(),

    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT')
});

// ─── Cross-field refine helpers ───────────────────────────────────────────────
// 1. Ensures registration_deadline is on or before event_date.
const deadlineRefine = (data) => {
    if (!data.registration_deadline || !data.event_date) return true;
    return data.registration_deadline <= data.event_date;
};
const deadlineRefineConfig = {
    message: 'Registration deadline cannot be after the event date.',
    path: ['registration_deadline']
};

// 2. If deadline date is on the event date, closing time cannot be after event start time.
const deadlineTimeRefine = (data) => {
    if (!data.registration_deadline || !data.event_date || !data.registration_deadline_time || !data.start_time) return true;
    const d1 = data.registration_deadline instanceof Date
        ? data.registration_deadline.toISOString().slice(0, 10)
        : String(data.registration_deadline).slice(0, 10);
    const d2 = data.event_date instanceof Date
        ? data.event_date.toISOString().slice(0, 10)
        : String(data.event_date).slice(0, 10);

    if (d1 === d2) {
        return data.registration_deadline_time <= data.start_time;
    }
    return true;
};
const deadlineTimeRefineConfig = {
    message: 'Registration closing time cannot be after event start time when deadline is on the event day.',
    path: ['registration_deadline_time']
};


// ─────────────────────────────────────────────────────────────────
// CREATE EVENT SCHEMA
// All fields validated strictly. Used for POST /api/events/create.
// Cross-field refines added after the object definition (NOT before .partial()).
// ─────────────────────────────────────────────────────────────────
const createEventSchema = baseEventShape
    .refine(deadlineRefine, deadlineRefineConfig)
    .refine(deadlineTimeRefine, deadlineTimeRefineConfig);


// ─────────────────────────────────────────────────────────────────
// UPDATE EVENT STATUS SCHEMA
// Used only for the quick status toggle (DRAFT/PUBLISHED/CANCELLED).
// Route: PUT /api/events/:id/status
// ─────────────────────────────────────────────────────────────────
const updateEventStatusSchema = z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED'], {
        required_error: 'Status is required.',
        invalid_type_error: 'Invalid status. Allowed: DRAFT, PUBLISHED, CANCELLED'
    })
});


// ─────────────────────────────────────────────────────────────────
// UPDATE EVENT SCHEMA
// .partial() must be called on the BASE shape (before any .refine()),
// because Zod v4 disallows .partial() on refined schemas.
// We then re-apply the cross-field refines after .partial().
// ─────────────────────────────────────────────────────────────────
const updateEventSchema = baseEventShape
    .partial()
    .refine(deadlineRefine, deadlineRefineConfig)
    .refine(deadlineTimeRefine, deadlineTimeRefineConfig);


module.exports = {
    createEventSchema,
    updateEventStatusSchema,
    updateEventSchema
};
