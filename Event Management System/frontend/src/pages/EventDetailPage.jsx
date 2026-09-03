// frontend/src/pages/EventDetailPage.jsx
//
// RESPONSIBILITY: Dedicated Event Detail page — /events/:id
// Data Source: Backend API — GET /api/events/public/:id

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    Tag,
    Users,
    Globe,
    ArrowLeft,
    Ticket,
    Clock,
    BadgeCheck,
    LogIn,
} from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import RegistrationModal from '../components/events/RegistrationModal';
import { useAuth } from '../Context/AuthContext';
import { getPublicEventById } from '../services/eventService';

// No longer need static ALL_EVENTS as we fetch from API.

// ─── Reusable: Event Info Row ─────────────────────────────────────────────────
// DRY: Event ki individual details (date, location, etc.) ke liye ek row
const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-black-600" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-indigo-700 text-base' : 'text-gray-800'}`}>
                {value}
            </p>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const EventDetailPage = () => {
    // URL se event ID nikalo — e.g. /events/3 se id = '3'
    const { id } = useParams();
    const navigate = useNavigate();

    // Auth state: kya user logged in hai?
    const { isAuthenticated } = useAuth();

    // Modal visibility state
    const [showModal, setShowModal] = useState(false);

    // API data states
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // ID change hone par event fetch karo
    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const data = await getPublicEventById(id);
                setEvent(data.data);
            } catch (err) {
                // 404 = event nahi mila, baaki koi bhi error
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    // Registration button handler
    const handleRegisterClick = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/events/${id}` } });
            return;
        }
        setShowModal(true);
    };

    // ── Loading State ───────────────────────────────────────────────────────────────────────
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


    // ── Not Found State ────────────────────────────────────────────────────────────────────
    if (notFound || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <Calendar size={56} className="text-gray-200 mb-5" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
                    <p className="text-gray-500 mb-6">Yeh event exist nahi karta ya hata diya gaya hai.</p>
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

    // Format API data to match component expectations
    const title = event.title;
    const location = event.venue;
    const category = event.category;
    const price = event.price || 'Free';
    const description = event.description;
    const capacity = `${event.capacity} Attendees`;
    const image = event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

    // Format Date & Time
    const date = new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const time = new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // Format organizer details from DB (with fallbacks if empty)
    const organizer = {
        name: event.organizer_name || 'Organizer',
        tagline: event.organizer_tagline || 'Creating unforgettable live experiences in Pakistan.',
        logo: event.organizer_logo || 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=200&q=80',
        banner: event.organizer_banner || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
        website: event.organizer_website || 'eventify.pk',
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Shared Navbar — DRY */}
            <Navbar />

            {/* ── 1. FULL-WIDTH COMPANY BANNER ─────────────────────────────── */}
            {/* User ne kaha: "page k top par full width mein company ka banner" */}
            <div className="relative w-full h-72 sm:h-80 lg:h-96 overflow-hidden ">
                {/* Banner image — organizer ki company ki branding */}
                <img
                    src={organizer.banner}
                    alt={`${organizer.name} banner`}
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlay — text readable banaane ke liye */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-900/50 to-transparent" />



                {/* ── 2. COMPANY PROFILE SECTION — banner ke upar overlay ────── */}
                {/* User ne kaha: "company ki profile pic aur neeche company ki details" */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-16 pb-6">
                    <div className="max-w-6xl mx-auto flex items-end gap-5 flex-wrap">

                        {/* Company Logo / Profile Pic */}
                        <div className="relative shrink-0">
                            <img
                                src={organizer.logo}
                                alt={`${organizer.name} logo`}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                            />
                            {/* Verified badge — company verified hone ki nishani */}
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
            {/* Company ki website aur description — banner ke theek neeche */}
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

                    {/* ── LEFT: Event Image + Description ────────────────────── */}
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

                    {/* ── RIGHT: Event Details Card + Registration Button ─────── */}
                    {/* User ne kaha: "registration ka button hona chahiye" */}
                    <div className="space-y-5">

                        {/* Event Details Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">
                                Event Details
                            </h3>

                            {/* DRY: InfoRow component se sab details — duplicate code nahi */}
                            <InfoRow icon={Calendar} label="Date" value={date} />
                            <InfoRow icon={Clock} label="Time" value={time} />
                            <InfoRow icon={MapPin} label="Location" value={location} />
                            <InfoRow icon={Users} label="Capacity" value={capacity} />
                            <InfoRow icon={Ticket} label="Ticket Price" value={price} highlight />
                        </div>

                        {/* ── REGISTRATION BUTTON ─────────────────────────────── */}
                        {/* Behavior:
                            - Logged out → Login pe redirect (with return URL)
                            - Logged in → Modal kholo
                            Kyun button aur Link nahi? Button onClick se logic handle hota hai,
                            Link sirf static navigation ke liye hai. */}
                        <button
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

            {/* ── REGISTRATION MODAL ────────────────────────────────────────── */}
            {/* Conditional render: sirf jab showModal true ho tab mount karo */}
            {/* Kyun conditional? Jab modal nahi dikhna tab DOM mein hona zaroorat nahi — performance */}
            {showModal && (
                <RegistrationModal
                    event={{ id, title, price, capacity }}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default EventDetailPage;
