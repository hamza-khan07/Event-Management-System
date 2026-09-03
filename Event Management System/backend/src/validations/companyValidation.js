const { z } = require('zod');

// ─────────────────────────────────────────────────────────────────
// CREATE / UPDATE COMPANY SCHEMA
// ─────────────────────────────────────────────────────────────────
const companySchema = z.object({
    name: z.string({ required_error: 'Company name is required' })
        .trim()
        .min(2, 'Company name must be at least 2 characters'),
    description: z.string().optional().nullable(),
    email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable().or(z.literal('')),
    logo: z.string().optional().nullable().or(z.literal('')),
    banner: z.string().optional().nullable().or(z.literal('')),
    tagline: z.string().optional().nullable().or(z.literal('')),
});

// ─────────────────────────────────────────────────────────────────
// UPDATE COMPANY STATUS SCHEMA
// ─────────────────────────────────────────────────────────────────
const updateCompanyStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED'], {
        required_error: 'Status is required',
        invalid_type_error: 'Invalid status value. Allowed: ACTIVE, SUSPENDED'
    })
});

// ─────────────────────────────────────────────────────────────────
// ADD ORGANIZER SCHEMA
// ─────────────────────────────────────────────────────────────────
const addOrganizerSchema = z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format').trim(),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters')
});

module.exports = {
    companySchema,
    updateCompanyStatusSchema,
    addOrganizerSchema
};
