// frontend/src/pages/EventDetailPage.jsx
//
// RESPONSIBILITY: Dedicated Event Detail page — /events/:id
// Data Source: Backend API — GET /api/events/public/:id
//
// Registration Deadline Features:
//   - Displays registration_deadline in the Event Details info card
//   - Shows an urgency warning banner when deadline is ≤ 3 days away
//   - Disables the register button with a "Registration Closed" state if deadline has passed
//   - Server-side also enforces the deadline — client-side is UX only

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    Tag,
    Users,
    Globe,
    Ticket,
    Clock,
    BadgeCheck,
    LogIn,
    Lock,
    AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import RegistrationModal from '../components/events/RegistrationModal';
import { useAuth } from '../Context/AuthContext';
import { getPublicEventById } from '../services/eventService';
import {
    isRegistrationClosed,
    daysUntilDeadline,
    formatLocalDate
} from '../utils/dateUtils';


// ─── Reusable: Event Info Row ─────────────────────────────────────────────────
// Reusable row for displaying individual event details (date, location, etc.)
const InfoRow = ({ icon: Icon, label, value, highlight = false, iconColor = 'text-indigo-600' }) => (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
        <div className={`w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0`}>
            <Icon size={16} className={iconColor} />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-indigo-700 text-base' : 'text-gray-800'}`}>
                {value}
            </p>
        </div>
    </div>
);


// ─── Main Component ────────────────────────────────────────────────────────────
const EventDetailPage = () => {
    // Extract event ID from URL params (e.g. /events/3 -> id = '3')
    const { id } = useParams();
    const navigate = useNavigate();

    // Auth state: check if user is logged in
    const { isAuthenticated } = useAuth();

    // Modal visibility state
    const [showModal, setShowModal] = useState(false);

    // API data states
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Fetch event when ID changes
    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const data = await getPublicEventById(id);
                setEvent(data.data);
            } catch (err) {
                // Handle 404 or other fetch errors
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    // Registration button handler — checks auth, then opens modal
    const handleRegisterClick = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/events/${id}` } });
            return;
        }
        setShowModal(true);
    };

    // ── Loading State ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }


    // ── Not Found State ──────────────────────────────────────────────────────────
    if (notFound || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <Calendar size={56} className="text-gray-200 mb-5" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
                    <p className="text-gray-500 mb-6">This event does not exist or has been removed.</p>
                    <Link
                        to="/events"
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                    >
                        Back to All Events
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Derived Display Values ───────────────────────────────────────────────────
    const title       = event.title;
    const location    = event.venue;
    const category    = event.category;
    const price       = event.price || 'Free';
    const description = event.description;
    const capacity    = `${event.capacity} Attendees`;
    const image       = event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

    // Format Event Date & Time (timezone-safe)
    const date = formatLocalDate(event.event_date, { month: 'short', day: '2-digit', year: 'numeric' });
    const time = new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // ── Registration Deadline Calculations ────────────────────────────────────────
    // isRegistrationClosed uses the organizer-set closing time:
    //   - If deadline < today          → closed
    //   - If deadline = today and closing time set → closed once closing time passes
    //   - If deadline = today and no closing time  → open all day
    const registrationClosed = isRegistrationClosed(
        event.registration_deadline,
        event.registration_deadline_time
    );
    const daysLeft          = daysUntilDeadline(event.registration_deadline);
    const deadlineFormatted = event.registration_deadline
        ? formatLocalDate(event.registration_deadline, {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
          })
        : null;

    // Format organizer-set closing time for display (e.g. "11:59 PM")
    const deadlineTimeFormatted = event.registration_deadline_time
        ? new Date(`1970-01-01T${event.registration_deadline_time}`)
              .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : null;

    // Is deadline TODAY?
    const todayStr       = new Date().toLocaleDateString('sv-SE');
    const deadlineDayStr = String(event.registration_deadline || '').split('T')[0];
    const isDeadlineToday = deadlineDayStr === todayStr;

    // Minutes remaining until closing time (shown in urgency banner when <= 60 min left)
    let minutesUntilClose = null;
    if (isDeadlineToday && event.registration_deadline_time && !registrationClosed) {
        const [hh, mm] = String(event.registration_deadline_time).split(':').map(Number);
        const closeMs = new Date();
        closeMs.setHours(hh, mm, 0, 0);
        minutesUntilClose = Math.ceil((closeMs - new Date()) / (1000 * 60));
    }

    // Show urgency banner when deadline is within 3 days (but registration not yet closed)
    const showUrgencyBanner = !registrationClosed && daysLeft !== null && daysLeft <= 3;

    // Organizer details with fallbacks for missing DB values
    const organizer = {
        name:    event.organizer_name || 'Organizer',
        tagline: event.organizer_tagline || 'Creating unforgettable live experiences in Pakistan.',
        logo:    event.organizer_logo || 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=200&q=80',
        banner:  event.organizer_banner || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
        website: event.organizer_website || 'eventify.pk',
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Shared Navbar — DRY */}
            <Navbar />

            {/* ── 1. FULL-WIDTH COMPANY BANNER ─────────────────────────────── */}
            <div className="relative w-full h-72 sm:h-80 lg:h-96 overflow-hidden">
                {/* Banner image displaying organizer branding */}
                <img
                    src={organizer.banner}
                    alt={`${organizer.name} banner`}
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlay to enhance text contrast and readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-900/50 to-transparent" />

                {/* ── 2. COMPANY PROFILE SECTION — overlaid over banner ────── */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-16 pb-6">
                    <div className="max-w-6xl mx-auto flex items-end gap-5 flex-wrap">

                        {/* Company Logo */}
                        <div className="relative shrink-0">
                            <img
                                src={organizer.logo}
                                alt={`${organizer.name} logo`}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                            />
                            {/* Verified badge */}
                            <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 rounded-full p-1 border-2 border-white">
                                <BadgeCheck size={14} className="text-white" />
                            </div>
                        </div>

                        {/* Company Name + Tagline */}
                        <div className="flex-1 min-w-0 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                                    {organizer.name}
                                </h2>
                                <span className="px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold rounded-full">
                                    Verified Organizer
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm mt-1 line-clamp-1">{organizer.tagline}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. COMPANY EXTRA DETAILS BAR ────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe size={15} className="text-indigo-400 shrink-0" />
                        <a
                            href={organizer.website?.startsWith('http') ? organizer.website : `https://${organizer.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-medium"
                        >
                            {organizer.website}
                        </a>
                    </div>
                    <span className="text-gray-200 hidden sm:block">|</span>
                    <p className="text-sm text-gray-500 flex-1">{organizer.tagline}</p>
                </div>
            </div>

            {/* ── 4. MAIN CONTENT: Event Info + Registration ───────────────── */}
            <div className="flex-1 max-w-10xl mx-auto w-full px-4 sm:px-8 lg:px-16 py-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── LEFT: Event Image + Description ─────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Event Thumbnail */}
                        <div className="rounded-2xl overflow-hidden shadow-md aspect-[16/9]">
                            <img
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Event Title + Category */}
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
                                <Tag size={13} />
                                <span>{category}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                {title}
                            </h1>
                        </div>

                        {/* Event Description */}
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">
                                About This Event
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                        </div>
                    </div>

                    {/* ── RIGHT: Event Details Card + Registration Button ──── */}
                    <div className="space-y-5">

                        {/* Event Details Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">
                                Event Details
                            </h3>

                            {/* DRY: InfoRow component renders all detail items */}
                            <InfoRow icon={Calendar}  label="Date"          value={date} />
                            <InfoRow icon={Clock}     label="Time"          value={time} />
                            <InfoRow icon={MapPin}    label="Location"      value={location} />
                            <InfoRow icon={Users}     label="Capacity"      value={capacity} />
                            <InfoRow icon={Ticket}    label="Ticket Price"  value={price} highlight />

                            {/* Registration Deadline row — only shown when deadline exists */}
                            {deadlineFormatted && (
                                <InfoRow
                                    icon={registrationClosed ? Lock : Clock}
                                    label="Registration Deadline"
                                    value={registrationClosed
                                        ? `${deadlineFormatted}${deadlineTimeFormatted ? ` at ${deadlineTimeFormatted}` : ''} (Closed)`
                                        : daysLeft === 0
                                            ? deadlineTimeFormatted
                                                ? `${deadlineFormatted} — Closes at ${deadlineTimeFormatted}`
                                                : `${deadlineFormatted} — Closes Today!`
                                            : deadlineTimeFormatted
                                                ? `${deadlineFormatted} at ${deadlineTimeFormatted}`
                                                : deadlineFormatted
                                    }
                                    iconColor={registrationClosed
                                        ? 'text-red-500'
                                        : daysLeft !== null && daysLeft <= 3
                                            ? 'text-amber-500'
                                            : 'text-indigo-600'
                                    }
                                />
                            )}
                        </div>

                        {/* ── URGENCY BANNER — shown when deadline is ≤ 3 days away ── */}
                        {/* This creates urgency and encourages users to register quickly */}
                        {showUrgencyBanner && (
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">
                                        {isDeadlineToday
                                            ? minutesUntilClose !== null && minutesUntilClose <= 60
                                                ? `Registration closes in ${minutesUntilClose} minute${minutesUntilClose === 1 ? '' : 's'}!`
                                                : deadlineTimeFormatted
                                                    ? `Registration closes at ${deadlineTimeFormatted} today!`
                                                    : 'Registration closes today at midnight!'
                                            : daysLeft === 0
                                                ? 'Registration closes today!'
                                                : `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to register!`
                                        }
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        {isDeadlineToday
                                            ? deadlineTimeFormatted
                                                ? `You can register until ${deadlineTimeFormatted} today.`
                                                : `You can register until midnight tonight.`
                                            : `Deadline: ${deadlineFormatted}${deadlineTimeFormatted ? ` at ${deadlineTimeFormatted}` : ''}. Register before it's too late.`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── REGISTRATION CLOSED BANNER — shown when registration is locked ── */}
                        {registrationClosed && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <Lock size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-800">
                                        Registration is closed
                                    </p>
                                    <p className="text-xs text-red-600 mt-0.5">
                                        {isDeadlineToday && deadlineTimeFormatted
                                            ? `The registration closing time (${deadlineTimeFormatted}) has passed.`
                                            : `The registration deadline (${deadlineFormatted}) has passed.`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── REGISTRATION BUTTON / CLOSED STATE ──────────────── */}
                        {/* Behavior:
                            - registrationClosed → Shows locked, disabled button
                            - Logged out         → Redirect to login (with return URL)
                            - Logged in + open   → Open registration modal
                          Same-day rule: if deadline == event_date, locks at start_time not midnight */}
                        {registrationClosed ? (
                            // Registration is locked — disabled, no-interaction state
                            <div
                                id="register-closed-btn"
                                className="block w-full py-4 px-6 bg-gray-100 text-gray-400 font-bold text-base rounded-2xl text-center flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                <Lock size={18} />
                                Registration Closed
                            </div>
                        ) : (
                            // Registration is open — active button
                            <button
                                id="register-now-btn"
                                onClick={handleRegisterClick}
                                className="block w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base rounded-2xl text-center shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 cursor-pointer"
                            >
                                {isAuthenticated ? (
                                    <>
                                        <Ticket size={18} className="inline mr-2" />
                                        Register Now — {price}
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} className="inline mr-2" />
                                        Login to Register
                                    </>
                                )}
                            </button>
                        )}

                        {/* Secondary: Back to all events */}
                        <Link
                            to="/events"
                            className="block w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-2xl text-center transition cursor-pointer"
                        >
                            Browse More Events
                        </Link>
                    </div>
                </div>
            </div>

            {/* Shared Footer — DRY */}
            <Footer />

            {/* ── REGISTRATION MODAL ─────────────────────────────────────────── */}
            {/* Only mounted when showModal is true and deadline has NOT passed */}
            {/* Modal guard: only mount if registration is still open */}
            {showModal && !registrationClosed && (
                <RegistrationModal
                    event={{ id, title, price, capacity }}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default EventDetailPage;
