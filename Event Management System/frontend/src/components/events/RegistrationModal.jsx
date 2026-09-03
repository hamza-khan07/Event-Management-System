// frontend/src/components/events/RegistrationModal.jsx
//
// RESPONSIBILITY: Event registration form — modal style (overlay).
//
// UI States (3):
//   1. FORM    → user fields fill kar raha hai
//   2. LOADING → API call chal rahi hai (button disabled)
//   3. SUCCESS → registration ho gayi — confirmation code dikhao
//
// Props:
//   event    → { id, title, price } — event detail (parent se)
//   onClose  → modal band karne ka function
//   onSuccess → optional callback jab registration kamyaab ho

import React, { useState, useEffect } from 'react';
import {
    X, Ticket, Phone, User, Mail, CheckCircle2,
    Loader2, AlertCircle, Users
} from 'lucide-react';
import { registerForEvent, getEventCapacity } from '../../services/registrationService';
import { useAuth } from '../../Context/AuthContext';

// ─── Main Component ────────────────────────────────────────────────────────────
const RegistrationModal = ({ event, onClose, onSuccess }) => {
    const { user } = useAuth();    // Logged-in user ka data (pre-fill ke liye)

    // ── Form State ──────────────────────────────────────────────────────────
    // name aur email pre-fill karo user context se — editable hai taake user
    // form mein naam correct kar sake agar galat ho
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        ticket_count: 1,
        phone_number: ''
    });

    // ── UI State ─────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    // Capacity state: booked seats, total capacity
    // null jab tak API se data na aaye
    const [capacity, setCapacity] = useState(null);
    const [capacityLoading, setCapacityLoading] = useState(true);

    // ── Modal open hote hi capacity fetch karo ───────────────────────────────
    // Kyun useEffect? Side effect hai (API call) — render ke baad hona chahiye
    useEffect(() => {
        const fetchCapacity = async () => {
            try {
                const data = await getEventCapacity(event.id);
                if (data.success) setCapacity(data.data);
            } catch {
                // Capacity load nahi hua toh silently ignore — non-critical
                setCapacity(null);
            } finally {
                setCapacityLoading(false);
            }
        };

        fetchCapacity();
    }, [event.id]);

    // ── Escape key se modal band karo ────────────────────────────────────────
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // ── Body scroll lock ─────────────────────────────────────────────────────
    // Modal open ho tab background scroll na kare — UX standard practice
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    // ── Input Change Handler ──────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');   // User kuch type kare toh error clear ho — better UX
    };

    // ── Form Submit ───────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Backend sirf ticket_count aur phone_number leta hai.
            // name/email backend JWT se read karta hai — form ke editable fields
            // sirf UX ke liye hain (user check kar sake apna naam).
            const payload = {
                ticket_count: parseInt(formData.ticket_count),
                // empty string ko null mein convert karo — backend null expect karta hai
                phone_number: formData.phone_number.trim() || null
            };

            const data = await registerForEvent(event.id, payload);

            setSuccess(data.data);
            if (onSuccess) onSuccess(data.data);

        } catch (err) {
            // err.response?.data?.message → backend ka specific error message
            // err.message → network error ya unexpected JS error
            // Last fallback → generic message
            const backendMsg = err.response?.data?.message;
            const networkMsg = err.message;
            setError(backendMsg || networkMsg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SUCCESS STATE — Confirmation Screen
    // ══════════════════════════════════════════════════════════════════════════
    if (success) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                        You're Registered! 🎉
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">{event.title}</p>

                    {/* Confirmation Code */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
                        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-1">
                            Your Confirmation Code
                        </p>
                        <p className="text-2xl font-extrabold text-indigo-700 tracking-widest font-mono">
                            {success.registration_code}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Screenshot or save this code for smooth entry at the venue.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="text-left space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tickets</span>
                            <span className="font-semibold text-gray-800">{success.ticket_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Event Date</span>
                            <span className="font-semibold text-gray-800">
                                {new Date(success.event_date).toLocaleDateString('en-PK', {
                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Venue</span>
                            <span className="font-semibold text-gray-800 text-right max-w-[200px]">
                                {success.venue || 'TBD'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FORM STATE — Registration Form
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Modal Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">Register for Event</h2>
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{event.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* ── Modal Body — Form ─────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                    {/* Full Name — Pre-filled from account, editable */}
                    <div>
                        <label htmlFor="reg_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <User size={14} className="text-indigo-500" />
                                Full Name <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            id="reg_name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Email — Pre-filled from account, editable */}
                    <div>
                        <label htmlFor="reg_email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <Mail size={14} className="text-indigo-500" />
                                Email Address <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            id="reg_email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Ticket Count */}
                    <div>
                        <label htmlFor="ticket_count" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <Ticket size={14} className="text-indigo-500" />
                                Number of Tickets <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <select
                            id="ticket_count"
                            name="ticket_count"
                            value={formData.ticket_count}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                            required
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>{n} Ticket{n > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Phone Number (Optional) */}
                    <div>
                        <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <Phone size={14} className="text-indigo-500" />
                                Phone Number
                                <span className="text-gray-400 font-normal">(Optional)</span>
                            </span>
                        </label>
                        <input
                            id="phone_number"
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="e.g. +92 300 1234567"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            In case of emergency, organizer will contact you on this number.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <Ticket size={16} />
                                Confirm Registration
                            </>
                        )}
                    </button>

                    {/* ── Capacity Bar — Registered / Total ────────────────── */}
                    {/* Kyun yahan? User ko pata ho kitni seats baaki hain — urgency create hoti hai */}
                    <div className="pt-1">
                        {capacityLoading ? (
                            // Skeleton loader jab capacity load ho rahi ho
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        ) : capacity ? (
                            <div>
                                {/* Progress bar */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {capacity.booked} registered
                                    </span>
                                    <span>{capacity.total} total capacity</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${capacity.booked / capacity.total > 0.8
                                            ? 'bg-red-500'      // 80%+ full → red (urgency)
                                            : capacity.booked / capacity.total > 0.5
                                                ? 'bg-amber-400'   // 50-80% → amber (caution)
                                                : 'bg-green-500'   // <50% → green (comfortable)
                                            }`}
                                        style={{ width: `${Math.min((capacity.booked / capacity.total) * 100, 100)}%` }}
                                    />
                                </div>
                                {/* Full event warning */}
                                {capacity.isFull && (
                                    <p className="text-xs text-red-500 font-semibold mt-1 text-center">
                                        ⚠️ Event is fully booked
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RegistrationModal;
