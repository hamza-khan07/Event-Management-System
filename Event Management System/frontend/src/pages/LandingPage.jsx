// frontend/src/pages/LandingPage.jsx
//
// RESPONSIBILITY: Main public landing page for Eventify.

// Structure: Navbar -> Hero -> Featured Events -> How It Works -> Contact -> Footer

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // /events page par navigate karne ke liye
import {
    Search,
    Compass,
    Ticket,
    CalendarCheck,
    ArrowRight,
    Sparkles,
    Calendar,
    Users,
    ShieldCheck
} from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import EventCard from '../components/landing/EventCard';
import ContactSection from '../components/landing/ContactSection';

const FEATURED_EVENTS = [
    {
        id: '1',
        title: 'The Grand Music Festival 2024',
        date: 'Oct 26, 2024',
        time: '7:00 PM',
        location: 'Alhamra Arts Council, Lahore',
        category: 'Concert & Music',
        price: 'PKR 2,500',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        title: 'Tech Innovators Conference',
        date: 'Oct 28, 2024',
        time: '9:00 AM',
        location: 'Expo Centre, Lahore',
        category: 'Technology',
        price: 'Free',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        title: 'Foodies Carnival Lahore',
        date: 'Nov 02, 2024',
        time: '12:00 PM',
        location: 'Gulberg Galleria, Lahore',
        category: 'Food & Drinks',
        price: 'PKR 800',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '4',
        title: 'Contemporary Art Workshop',
        date: 'Nov 05, 2024',
        time: '3:00 PM',
        location: 'Shakir Ali Museum, Lahore',
        category: 'Art & Culture',
        price: 'PKR 1,200',
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '5',
        title: 'Outdoor Movie & Stargazing Night',
        date: 'Nov 10, 2024',
        time: '6:30 PM',
        location: 'Model Town Park, Lahore',
        category: 'Entertainment',
        price: 'PKR 1,500',
        image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '6',
        title: 'Startup Pitch Weekend',
        date: 'Nov 15, 2024',
        time: '10:00 AM',
        location: 'NIC Lahore, LUMS',
        category: 'Business & Networking',
        price: 'Free',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    },
];

const CATEGORY_TABS = ['All Events', 'Music', 'Technology', 'Food', 'Art & Culture', 'Business'];

const HOW_IT_WORKS = [
    {
        step: '1',
        title: 'Discover Events',
        description: 'Browse concerts, tech summits, and local workshops tailored to your city and interests.',
        icon: Compass,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        step: '2',
        title: 'Reserve Instantly',
        description: 'Secure your spot with instant verification, transparent pricing, and a digital QR pass.',
        icon: Ticket,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
    },
    {
        step: '3',
        title: 'Attend and Enjoy',
        description: 'Show your digital ticket at the gate and immerse yourself in memorable live experiences.',
        icon: CalendarCheck,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
    },
];

const LandingPage = () => {
    const navigate = useNavigate(); // page navigation ke liye
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All Events');

    const handleSearch = (e) => {
        e.preventDefault();
        const el = document.querySelector('#events');
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    const filteredEvents = FEATURED_EVENTS.filter((ev) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !q ||
            ev.title.toLowerCase().includes(q) ||
            ev.location.toLowerCase().includes(q) ||
            ev.category.toLowerCase().includes(q);

        const matchesTab =
            activeTab === 'All Events' ||
            ev.category.toLowerCase().includes(activeTab.toLowerCase());

        return matchesQuery && matchesTab;
    });

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navbar />

            {/* ---- 1. HERO SECTION ---- */}
            <section
                id="discover"
                className="relative min-h-[500px] lg:min-h-[550px] flex items-center justify-center overflow-hidden"
            >
                {/* Background Hero Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-bg.jpg"
                        alt="Live outdoor festival crowd at sunset"
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/55 to-gray-900/30" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white pt-24 pb-20">
                    {/* Top Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-7 tracking-wide">
                        <Sparkles size={13} className="text-amber-400" />
                        <span>Discover premier events across Pakistan</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.12] text-white drop-shadow-sm">
                        Discover &amp; Experience<br />
                        <span className="text-amber-400">Amazing Events</span> Near You!
                    </h1>

                    <p className="mt-5 text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed font-normal">
                        Explore thousands of concerts, workshops, conferences, and festivals.
                        Find your next unforgettable moment with Eventify.
                    </p>

                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="mt-9 max-w-2xl mx-auto bg-white rounded-2xl px-2 py-2 shadow-2xl flex flex-col sm:flex-row items-stretch gap-2"
                    >
                        <div className="flex items-center gap-3 flex-1 px-3 py-2">
                            <Search size={19} className="text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events, artists, locations..."
                                className="w-full text-gray-900 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-7 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Browse All Events</span>
                            <ArrowRight size={15} />
                        </button>
                    </form>

                    {/* Trust Signals */}
                    <div className="mt-9 flex flex-wrap justify-center gap-7 sm:gap-12 text-xs font-medium text-gray-300">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-amber-400" />
                            <span>150+ Verified Events</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-amber-400" />
                            <span>25,000+ Attendees</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-amber-400" />
                            <span>100% Secure Bookings</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- 2. FEATURED EVENTS SECTION ---- */}
            <section id="events" className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Featured Events
                        </h2>
                        <p className="mt-3 text-base text-gray-500">
                            Curated experiences with verified organizers and seamless booking.
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {CATEGORY_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === tab
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Events Grid — filtered results dikhata hai */}
                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                            {filteredEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                            <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                            <h4 className="font-bold text-gray-800">No events found</h4>
                            <p className="text-sm text-gray-500 mt-1">Try a different search term or category.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveTab('All Events');
                                }}
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}

                    {/* ---- "Explore All Events" CTA Button ---- */}
                    {/* Wireframe ke mutabiq: Featured Events section ke neeche center mein */}
                    <div className="flex justify-center mt-12">
                        <button
                            onClick={() => navigate('/events')}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                        >
                            <span>Explore All Events</span>
                            {/* Arrow icon hover par right mein thoda move karta hai */}
                            <ArrowRight
                                size={17}
                                className="transition-transform duration-200 group-hover:translate-x-1"
                            />
                        </button>
                    </div>
                </div>
            </section>

            {/* ---- 3. HOW IT WORKS SECTION ---- */}
            <section id="how-it-works" className="py-5 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                            Simple Process
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
                            How It Works
                        </h2>
                        <p className="mt-3 text-base text-gray-500">
                            From finding your favorite event to attending on the day — three effortless steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {HOW_IT_WORKS.map(({ step, title, description, icon: Icon, iconBg, iconColor }) => (
                            <div
                                key={step}
                                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center`}>
                                        <Icon size={26} />
                                    </div>
                                    <span className="text-4xl font-black text-gray-100 select-none">0{step}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {step}. {title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- 4. CONTACT US SECTION ---- */}
            <ContactSection />

            {/* ---- 5. FOOTER ---- */}
            <Footer />
        </div>
    );
};

export default LandingPage;
