// frontend/src/components/forms/EventForm.jsx
// Reusable form component shared across both Create and Edit event flows (DRY).
// Configured dynamically via mode="create" or mode="edit" prop.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toDateInputValue } from '../../utils/dateUtils';

const EVENT_CATEGORIES = [
    'Conference', 'Workshop', 'Seminar', 'Webinar',
    'Sports', 'Concert', 'Exhibition', 'Networking', 'Training', 'Other'
];

// Base URL for all API calls — change to env var before deploying to production
const API_BASE = 'http://localhost:5000';

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

    const [isFree, setIsFree] = useState(true);

    // ── Venue autocomplete state ──
    const [venueSuggestions, setVenueSuggestions] = useState([]);
    const [venueLoading, setVenueLoading] = useState(false);
    const venueContainerRef = useRef(null);  // For click-outside detection
    const venueDebounceRef  = useRef(null);  // Tracks active debounce timer

    const [formData, setFormData] = useState({
        title: '', description: '', category: '', venue: '',
        latitude: null, longitude: null,       // Auto-filled by geocoding
        event_date: '', start_time: '', end_time: '',
        registration_deadline: '',
        registration_deadline_time: '',        // Required: exact closing time on deadline day
        capacity: '',
        status: 'DRAFT',
        price: 'Free',
        image_url: ''
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Pre-populate fields in edit mode
    useEffect(() => {
        if (isEdit && eventData) {
            const formattedDate = toDateInputValue(eventData.event_date);
            const trimTime = (t) => t ? t.substring(0, 5) : '';
            const rawPrice = eventData.price || 'Free';
            const isEventFree = !rawPrice || rawPrice.trim().toLowerCase() === 'free' || rawPrice.trim() === '0';
            const formattedDeadline = toDateInputValue(eventData.registration_deadline);

            setIsFree(isEventFree);
            setFormData({
                title: eventData.title || '',
                description: eventData.description || '',
                category: eventData.category || '',
                venue: eventData.venue || '',
                latitude: eventData.latitude ? parseFloat(eventData.latitude) : null,
                longitude: eventData.longitude ? parseFloat(eventData.longitude) : null,
                event_date: formattedDate,
                start_time: trimTime(eventData.start_time),
                end_time: trimTime(eventData.end_time),
                registration_deadline: formattedDeadline,
                registration_deadline_time: trimTime(eventData.registration_deadline_time),
                capacity: eventData.capacity || '',
                status: eventData.status || 'DRAFT',
                price: isEventFree ? 'Free' : rawPrice,
                image_url: eventData.image_url || ''
            });
        }
    }, [isEdit, eventData]);

    // Close dropdown when user clicks outside the venue container
    useEffect(() => {
        const onClickOutside = (e) => {
            if (venueContainerRef.current && !venueContainerRef.current.contains(e.target)) {
                setVenueSuggestions([]);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // Called on every keystroke in Venue field.
    // ── Dual-source search: Nominatim + Photon API called in parallel ──────────
    // OSM/Nominatim and Photon have different indexing so combining them gives
    // far better coverage — especially for Pakistani venues and sub-locations.
    const handleVenueChange = (e) => {
        const val = e.target.value;

        // Coordinates are cleared only when the field is fully empty.
        // For non-empty edits (e.g. adding ", Hall 3"), venue text updates but coords stay.
        if (val.trim() === '') {
            setFormData(prev => ({ ...prev, venue: val, latitude: null, longitude: null }));
        } else {
            setFormData(prev => ({ ...prev, venue: val }));
        }
        if (errors.venue) setErrors(prev => ({ ...prev, venue: '' }));
        setApiError('');

        // Cancel the previous pending search
        if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);

        if (!val || val.length < 3) {
            setVenueSuggestions([]);
            setVenueLoading(false);
            return;
        }

        // Schedule fresh search after 600ms of inactivity
        venueDebounceRef.current = setTimeout(async () => {
            setVenueLoading(true);
            try {
                const encoded = encodeURIComponent(val);

                // ── Fire both APIs simultaneously ──
                const [nominatimRes, photonRes] = await Promise.allSettled([
                    fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=0`,
                        { headers: { 'Accept-Language': 'en' } }
                    ).then(r => r.ok ? r.json() : []),
                    fetch(
                        `https://photon.komoot.io/api/?q=${encoded}&limit=5&lang=en`
                    ).then(r => r.ok ? r.json() : { features: [] })
                ]);

                // ── Parse Nominatim results (already in our format) ──
                const fromNominatim = nominatimRes.status === 'fulfilled'
                    ? (Array.isArray(nominatimRes.value) ? nominatimRes.value : [])
                    : [];

                // ── Parse Photon results (GeoJSON → normalize to Nominatim shape) ──
                const fromPhoton = photonRes.status === 'fulfilled' && photonRes.value?.features
                    ? photonRes.value.features.map((f, i) => {
                        const p = f.properties;
                        const nameParts = [
                            p.name,
                            p.street ? `${p.housenumber || ''} ${p.street}`.trim() : null,
                            p.district || p.suburb,
                            p.city,
                            p.state,
                            p.country
                        ].filter(Boolean);
                        return {
                            place_id: `photon_${p.osm_id || i}`,
                            display_name: nameParts.join(', '),
                            lat: f.geometry.coordinates[1].toString(),  // GeoJSON: [lng, lat]
                            lon: f.geometry.coordinates[0].toString(),
                        };
                    })
                    : [];

                // ── Merge + deduplicate (same coords rounded to 3 dp = same place) ──
                const seen = new Set();
                const merged = [...fromNominatim, ...fromPhoton].filter(place => {
                    const key = `${parseFloat(place.lat).toFixed(3)},${parseFloat(place.lon).toFixed(3)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }).slice(0, 8);

                setVenueSuggestions(merged);
            } catch {
                setVenueSuggestions([]);
            } finally {
                setVenueLoading(false);
            }
        }, 600);
    };

    // Called when organizer clicks a suggestion from the dropdown
    const handleVenueSelect = (place) => {
        setFormData(prev => ({
            ...prev,
            venue:     place.display_name,
            latitude:  parseFloat(place.lat),
            longitude: parseFloat(place.lon),
        }));
        setVenueSuggestions([]);
        setVenueLoading(false);
        if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setApiError('');
    };

    // Client-side validation to provide immediate user feedback before API call
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

        // Registration deadline: required and must not be after the event date
        if (!formData.registration_deadline)
            newErrors.registration_deadline = 'Registration deadline is required.';
        if (formData.registration_deadline && formData.event_date &&
            formData.registration_deadline > formData.event_date)
            newErrors.registration_deadline = 'Registration deadline cannot be after the event date.';

        // Registration closing time: required and must not be after start time on event day
        if (!formData.registration_deadline_time) {
            newErrors.registration_deadline_time = 'Registration closing time is required.';
        } else if (
            formData.registration_deadline &&
            formData.event_date &&
            formData.registration_deadline === formData.event_date &&
            formData.start_time &&
            formData.registration_deadline_time > formData.start_time
        ) {
            newErrors.registration_deadline_time =
                'Closing time cannot be after event start time when deadline is on the event day.';
        }

        if (!formData.capacity || isNaN(parseInt(formData.capacity)) || parseInt(formData.capacity) < 1)
            newErrors.capacity = 'Capacity must be a positive number.';

        if (!isFree) {
            if (!formData.price || !formData.price.trim() || formData.price.trim().toLowerCase() === 'free') {
                newErrors.price = 'Ticket price is required for paid events (e.g. PKR 1,500).';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Generic submit with a given status override
    const submitWithStatus = async (overrideStatus) => {
        setApiError(''); setSuccessMsg('');
        if (!validate()) return;
        setSubmitting(true);

        const payload = {
            ...formData,
            status:    overrideStatus ?? formData.status,
            price:     isFree ? 'Free' : formData.price.trim(),
            image_url: formData.image_url?.trim() || null,
            // Always send current coordinates — whatever is in formData goes to DB directly.
            // Dropdown selection updates formData.lat/lng; field clear resets them to null.
            latitude:  formData.latitude  ?? null,
            longitude: formData.longitude ?? null,
            registration_deadline_time: formData.registration_deadline_time.trim(),
        };

        try {
            const res = isEdit
                ? await axios.put(`${API_BASE}/api/events/${eventId}`, payload, { withCredentials: true })
                : await axios.post(`${API_BASE}/api/events/create`, payload, { withCredentials: true });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Default submit: keep current formData.status
        submitWithStatus(formData.status);
    };

    // handleSaveAsDraft / handlePublish override the status without a redundant state update
    // because submitWithStatus() already uses the overrideStatus argument directly.
    const handleSaveAsDraft = (e) => {
        e.preventDefault();
        submitWithStatus('DRAFT');
    };

    const handlePublish = (e) => {
        e.preventDefault();
        submitWithStatus('PUBLISHED');
    };

    // Local date string in YYYY-MM-DD format (avoids UTC offset shifts)
    const todayStr = new Date().toLocaleDateString('sv-SE');

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
                        placeholder="Provide details about the event, agenda, speakers, etc."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </FormField>
                <FormField label="Category">
                    <select name="category" value={formData.category} onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">-- Select Category --</option>
                        {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </FormField>
                <FormField label="Event Banner Image URL">
                    <input type="url" name="image_url" value={formData.image_url} onChange={handleChange}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-[11px] text-gray-400 mt-1">
                        Optional direct link to an image banner (JPG, PNG, WebP) to display on cards.
                    </p>
                </FormField>
            </SectionCard>

            <SectionCard title="Pricing & Tickets">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Admission Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${isFree ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            <input
                                type="radio"
                                name="pricing_type"
                                checked={isFree}
                                onChange={() => {
                                    setIsFree(true);
                                    setFormData(prev => ({ ...prev, price: 'Free' }));
                                    if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                                }}
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Free Event
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Attendees can register and attend at zero cost.
                                </p>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${!isFree ? 'border-blue-500 bg-blue-50/70 shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            <input
                                type="radio"
                                name="pricing_type"
                                checked={!isFree}
                                onChange={() => {
                                    setIsFree(false);
                                    setFormData(prev => ({ ...prev, price: prev.price === 'Free' ? '' : prev.price }));
                                }}
                                className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                    Paid Event
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Attendees pay a ticket fee to register.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {!isFree && (
                    <FormField label="Ticket Price / Fee" required error={errors.price}>
                        <div className="relative">
                            <input
                                type="text"
                                name="price"
                                value={formData.price === 'Free' ? '' : formData.price}
                                onChange={handleChange}
                                placeholder="e.g. PKR 2,500 or $25"
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                            Tip: Specify price with currency if needed (e.g., "PKR 1,500", "PKR 5,000", or "$30").
                        </p>
                    </FormField>
                )}
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

                {/* Registration Deadline — required field. max is set to event_date so the
                    browser date picker prevents the organizer from selecting a date past the event. */}
                <FormField label="Registration Deadline" required error={errors.registration_deadline}>
                    <input
                        type="date"
                        name="registration_deadline"
                        value={formData.registration_deadline}
                        onChange={handleChange}
                        min={todayStr}
                        max={formData.event_date || undefined}  // Cannot set deadline after event date
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.registration_deadline ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                        After this date, users will not be able to register for this event.
                    </p>
                </FormField>

                {/* Registration Closing Time — required. Organizers must set when registration closes. */}
                <FormField label="Registration Closing Time" required error={errors.registration_deadline_time}>
                    <input
                        type="time"
                        name="registration_deadline_time"
                        value={formData.registration_deadline_time}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.registration_deadline_time ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                        Registration will close at this exact time on the deadline date.
                    </p>
                </FormField>
            </SectionCard>

            <SectionCard title="Venue & Capacity">
                {/* ── Venue Autocomplete ── */}
                <FormField label="Venue">
                    <div className="relative" ref={venueContainerRef}>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleVenueChange}
                            autoComplete="off"
                            placeholder="e.g. Lahore Expo Centre, Hall 3"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Loading spinner */}
                        {venueLoading && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">
                                Searching…
                            </span>
                        )}

                        {/* Suggestions dropdown */}
                        {venueSuggestions.length > 0 && (
                            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                {venueSuggestions.map((place) => (
                                    <li
                                        key={place.place_id}
                                        onMouseDown={() => handleVenueSelect(place)}
                                        className="px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-100 last:border-0 transition"
                                    >
                                        📍 {place.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Coordinate detection badge */}
                    {formData.latitude && formData.longitude ? (
                        <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                            ✓ Location detected: {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                        </p>
                    ) : (
                        <p className="text-[11px] text-gray-400 mt-1">
                            Type a venue name and select from suggestions. For specific halls (e.g. Hall 3),
                            search the main venue first, select it — then edit the text to add hall details.
                        </p>
                    )}
                </FormField>

                <FormField label="Maximum Capacity" required error={errors.capacity}>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min={1}
                        placeholder="e.g. 500"
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                </FormField>
            </SectionCard>

            {/* ── Publishing Section ── */}
            {/* Create mode: radio buttons to choose DRAFT or PUBLISHED */}
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

            {/* Edit mode: show current status + allow changing to DRAFT or PUBLISHED */}
            {isEdit && (
                <SectionCard title="Publishing Status">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500 font-medium">Current Status:</span>
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${formData.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700'
                                : formData.status === 'CANCELLED' ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                            {formData.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        Use the buttons below to save changes as <strong>Draft</strong> or directly <strong>Publish</strong> this event.
                        {formData.status === 'CANCELLED' && (
                            <span className="block mt-1 text-amber-600 font-medium">⚠ This event is currently CANCELLED. You can re-save it as Draft or re-publish it.</span>
                        )}
                    </p>
                </SectionCard>
            )}

            {/* ── Footer Buttons ── */}
            <div className="flex justify-end gap-3 pb-6">
                <button type="button" onClick={() => navigate('/organizer/events')}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                    Cancel
                </button>

                {/* Edit mode: separate Draft + Publish buttons */}
                {isEdit ? (
                    <>
                        <button
                            type="button"
                            onClick={handleSaveAsDraft}
                            disabled={submitting || !!successMsg}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition disabled:opacity-60"
                        >
                            {submitting && formData.status === 'DRAFT' ? 'Saving...' : '💾 Save as Draft'}
                        </button>
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={submitting || !!successMsg}
                            className="px-8 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-60"
                        >
                            {submitting && formData.status === 'PUBLISHED' ? 'Publishing...' : '↑ Publish Event'}
                        </button>
                    </>
                ) : (
                    /* Create mode: single button whose label matches selected status radio */
                    <button type="submit" disabled={submitting || !!successMsg}
                        className={`px-8 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 ${formData.status === 'PUBLISHED'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}>
                        {submitting
                            ? (formData.status === 'PUBLISHED' ? 'Publishing...' : 'Saving Draft...')
                            : (formData.status === 'PUBLISHED' ? '↑ Publish Event' : '💾 Save as Draft')}
                    </button>
                )}
            </div>
        </form>
    );
};

export default EventForm;
