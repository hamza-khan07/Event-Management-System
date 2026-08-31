// frontend/src/components/forms/EventForm.jsx
// Kyun alag component? DRY principle — Create aur Edit dono same form use karein.
// mode="create" ya mode="edit" prop se behavior change hoga.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EVENT_CATEGORIES = [
    'Conference', 'Workshop', 'Seminar', 'Webinar',
    'Sports', 'Concert', 'Exhibition', 'Networking', 'Training', 'Other'
];

const FormField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠</span> {error}
            </p>
        )}
    </div>
);

const SectionCard = ({ title, children }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h2>
        <div className="space-y-4">{children}</div>
    </div>
);

// ─── Props ───────────────────────────────────────────────────────
// mode       → 'create' | 'edit'
// eventData  → (edit mode only) existing event object to prefill
// eventId    → (edit mode only) event ID for PUT request
const EventForm = ({ mode = 'create', eventData = null, eventId = null }) => {
    const navigate = useNavigate();
    const isEdit = mode === 'edit';

    const [formData, setFormData] = useState({
        title: '', description: '', category: '', venue: '',
        event_date: '', start_time: '', end_time: '', capacity: '',
        status: 'DRAFT'
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Edit mode mein — existing data se form prefill karo
    useEffect(() => {
        if (isEdit && eventData) {
            const formattedDate = eventData.event_date
                ? new Date(eventData.event_date).toISOString().split('T')[0]
                : '';

            // MySQL time columns "HH:MM:SS" return karte hain (e.g., "09:00:00")
            // lekin HTML <input type="time"> aur Zod dono "HH:MM" expect karte hain.
            // .substring(0, 5) → "09:00:00" se sirf "09:00" nikalo
            const trimTime = (t) => t ? t.substring(0, 5) : '';

            setFormData({
                title: eventData.title || '',
                description: eventData.description || '',
                category: eventData.category || '',
                venue: eventData.venue || '',
                event_date: formattedDate,
                start_time: trimTime(eventData.start_time),
                end_time: trimTime(eventData.end_time),
                capacity: eventData.capacity || '',
                status: eventData.status || 'DRAFT',
            });
        }
    }, [isEdit, eventData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setApiError('');
    };

    // Frontend validation — UX ke liye (network call bachao)
    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim() || formData.title.trim().length < 3)
            newErrors.title = 'Title must be at least 3 characters.';
        if (!formData.event_date)
            newErrors.event_date = 'Event date is required.';
        if (!formData.start_time)
            newErrors.start_time = 'Start time is required.';
        if (!formData.end_time)
            newErrors.end_time = 'End time is required.';
        if (formData.start_time && formData.end_time && formData.end_time <= formData.start_time)
            newErrors.end_time = 'End time must be after start time.';
        if (!formData.capacity || isNaN(parseInt(formData.capacity)) || parseInt(formData.capacity) < 1)
            newErrors.capacity = 'Capacity must be a positive number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError(''); setSuccessMsg('');
        if (!validate()) return;
        setSubmitting(true);

        try {
            const res = isEdit
                // Edit: PUT /api/events/:id
                ? await axios.put(`http://localhost:5000/api/events/${eventId}`, formData, { withCredentials: true })
                // Create: POST /api/events/create
                : await axios.post('http://localhost:5000/api/events/create', formData, { withCredentials: true });

            if (res.data.success) {
                setSuccessMsg(res.data.message);
                setTimeout(() => navigate('/organizer/events'), 1500);
            }
        } catch (err) {
            setApiError(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {successMsg && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                    <span>✓</span> {successMsg} Redirecting...
                </div>
            )}
            {apiError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <span>✗</span> {apiError}
                </div>
            )}

            <SectionCard title="Basic Information">
                <FormField label="Event Title" required error={errors.title}>
                    <input type="text" name="title" value={formData.title} onChange={handleChange}
                        placeholder="e.g. Annual Tech Conference 2025"
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                </FormField>
                <FormField label="Description">
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </FormField>
                <FormField label="Category">
                    <select name="category" value={formData.category} onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">-- Select Category --</option>
                        {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </FormField>
            </SectionCard>

            <SectionCard title="Date & Time">
                <FormField label="Event Date" required error={errors.event_date}>
                    <input type="date" name="event_date" value={formData.event_date} onChange={handleChange}
                        min={todayStr}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.event_date ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Start Time" required error={errors.start_time}>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.start_time ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                    </FormField>
                    <FormField label="End Time" required error={errors.end_time}>
                        <input type="time" name="end_time" value={formData.end_time} onChange={handleChange}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.end_time ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                    </FormField>
                </div>
            </SectionCard>

            <SectionCard title="Venue & Capacity">
                <FormField label="Venue">
                    <input type="text" name="venue" value={formData.venue} onChange={handleChange}
                        placeholder="e.g. Lahore Expo Centre, Hall 3"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </FormField>
                <FormField label="Maximum Capacity" required error={errors.capacity}>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min={1}
                        placeholder="e.g. 500"
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                </FormField>
            </SectionCard>

            {/* Status radio — sirf Create mode mein dikhao, Edit mein status
                drawer se change hota hai (DRAFT → PUBLISHED → CANCELLED flow) */}
            {!isEdit && (
                <SectionCard title="Publishing">
                    <div className="flex gap-4 mt-1">
                        {['DRAFT', 'PUBLISHED'].map(s => (
                            <label key={s} className={`flex-1 flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${formData.status === s ? (s === 'DRAFT' ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50') : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="status" value={s} checked={formData.status === s} onChange={handleChange} className="mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{s === 'DRAFT' ? 'Save as Draft' : 'Publish Now'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {s === 'DRAFT' ? 'Saved but not visible to participants yet.' : 'Immediately open for registrations.'}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </SectionCard>
            )}

            <div className="flex justify-end gap-3 pb-6">
                <button type="button" onClick={() => navigate('/organizer/events')}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                    Cancel
                </button>
                <button type="submit" disabled={submitting || !!successMsg}
                    className="px-8 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-60">
                    {submitting
                        ? (isEdit ? 'Updating...' : 'Creating...')
                        : (isEdit ? 'Update Event' : 'Create Event')}
                </button>
            </div>
        </form>
    );
};

export default EventForm;
