// frontend/src/pages/EventDetailPage.jsx
//
// RESPONSIBILITY: Dedicated Event Detail page — /events/:id
//
// Page Structure (upar se neeche):
//   1. Full-width Company Banner (top par)
//   2. Company Profile Section — logo, naam, tagline, details, stats
//   3. Event Info Card — title, date, time, location, price, capacity, description
//   4. Registration Button — prominent CTA
//   5. Navbar + Footer (DRY: shared components)
//
// Data Source: ALL_EVENTS array se id match kar ke event nikalta hai.
// Aage yahan API call lagegi: useEffect(() => fetchEvent(id), [id])

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    Tag,
    Users,
    Globe,
    Building2,
    ArrowLeft,
    Ticket,
    Clock,
    BadgeCheck,
} from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Events Data — same array jo AllEventsPage mein use hoti hai ──────────────
// DRY: Data ek jagah rakhna better hoga (shared file/context/API) —
// abhi duplicate isliye kiya kyunke routing alag file mein hai.
// Aage `src/data/events.js` mein move kar sakte hain.
const ALL_EVENTS = [
    {
        id: '1',
        title: 'The Grand Music Festival 2024',
        date: 'Oct 26, 2024',
        time: '7:00 PM',
        location: 'Alhamra Arts Council, Lahore',
        category: 'Concert & Music',
        price: 'PKR 2,500',
        description: 'Pakistan ka sab se bada outdoor music festival — live bands, solo artists, aur DJ nights ek sath! Alhamra Arts Council ki khubsoorat setting mein ek yaadigaar shaam.',
        capacity: '5,000 Attendees',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'SoundWave Productions',
            tagline: 'Creating unforgettable live music experiences since 2010.',
            logo: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
            founded: '2010',
            employees: '45+',
            website: 'soundwave.pk',
            totalEvents: 120,
        },
    },
    {
        id: '2',
        title: 'Tech Innovators Conference',
        date: 'Oct 28, 2024',
        time: '9:00 AM',
        location: 'Expo Centre, Lahore',
        category: 'Technology',
        price: 'Free',
        description: 'Pakistan ke leading tech entrepreneurs, developers aur investors ke saath ek din ka conference. AI, Web3, aur startup ecosystem par deep-dive sessions.',
        capacity: '2,000 Attendees',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'TechPK Hub',
            tagline: "Bridging Pakistan's tech talent with global opportunities.",
            logo: 'https://images.unsplash.com/photo-1568952433726-3896e3881c65?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
            founded: '2015',
            employees: '30+',
            website: 'techpkhub.com',
            totalEvents: 85,
        },
    },
    {
        id: '3',
        title: 'Foodies Carnival Lahore',
        date: 'Nov 02, 2024',
        time: '12:00 PM',
        location: 'Gulberg Galleria, Lahore',
        category: 'Food & Drinks',
        price: 'PKR 800',
        description: 'Lahore ke 50+ top restaurants aur street food stalls ek jagah! Live cooking demos, food competitions, aur family-friendly activities.',
        capacity: '3,500 Attendees',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'Carnival Events Co.',
            tagline: 'Pakistan ki sabse rang-birangi event management company.',
            logo: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
            founded: '2012',
            employees: '60+',
            website: 'carnivalevents.pk',
            totalEvents: 200,
        },
    },
    {
        id: '4',
        title: 'Contemporary Art Workshop',
        date: 'Nov 05, 2024',
        time: '3:00 PM',
        location: 'Shakir Ali Museum, Lahore',
        category: 'Art & Culture',
        price: 'PKR 1,200',
        description: 'Renowned artists ke saath haath se seekhein — watercolor, acrylic aur digital art techniques. Beginners se advanced sab ke liye munaasib.',
        capacity: '200 Attendees',
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'ArtSpace Lahore',
            tagline: 'Nurturing creativity and artistic expression across Pakistan.',
            logo: 'https://images.unsplash.com/photo-1578926288207-a90a5366759d?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=1600&q=80',
            founded: '2018',
            employees: '15+',
            website: 'artspacelahore.com',
            totalEvents: 45,
        },
    },
    {
        id: '5',
        title: 'Outdoor Movie & Stargazing Night',
        date: 'Nov 10, 2024',
        time: '6:30 PM',
        location: 'Model Town Park, Lahore',
        category: 'Entertainment',
        price: 'PKR 1,500',
        description: 'Open-air cinema ke saath stargazing ka magical combination — telescope sessions, popcorn, cozy seating aur classic Pakistani films ki screening.',
        capacity: '800 Attendees',
        image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'StarNight Experiences',
            tagline: 'Crafting magical outdoor experiences under the open sky.',
            logo: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1600&q=80',
            founded: '2019',
            employees: '12+',
            website: 'starnight.pk',
            totalEvents: 30,
        },
    },
    {
        id: '6',
        title: 'Startup Pitch Weekend',
        date: 'Nov 15, 2024',
        time: '10:00 AM',
        location: 'NIC Lahore, LUMS',
        category: 'Business & Networking',
        price: 'Free',
        description: '48 ghante mein apna idea pitch karo — mentors, investors aur industry leaders se seedha guidance. Winner ko seed funding ka mauqa!',
        capacity: '500 Attendees',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'NIC Lahore',
            tagline: "Pakistan's premier startup incubator fueling entrepreneurship.",
            logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
            founded: '2014',
            employees: '80+',
            website: 'niclahore.org',
            totalEvents: 300,
        },
    },
    {
        id: '7',
        title: 'Karachi Literature Festival',
        date: 'Dec 01, 2024',
        time: '10:00 AM',
        location: 'Beach Luxury Hotel, Karachi',
        category: 'Art & Culture',
        price: 'Free',
        description: 'Pakistan aur duniya bhar ke mashhoor writers, poets aur journalists ke saath literary sessions, book launches aur panel discussions.',
        capacity: '4,000 Attendees',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'Oxford University Press Pakistan',
            tagline: 'Promoting literature, knowledge and reading culture in Pakistan.',
            logo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
            founded: '1978',
            employees: '200+',
            website: 'oup.com/pk',
            totalEvents: 500,
        },
    },
    {
        id: '8',
        title: 'Pakistan Sports Summit',
        date: 'Dec 05, 2024',
        time: '9:00 AM',
        location: 'Islamabad Sports Complex',
        category: 'Sports',
        price: 'PKR 500',
        description: 'Cricket, hockey, kabaddi — Pakistan ke national sports champions ke saath panel discussions, live demos aur youth coaching clinics.',
        capacity: '1,500 Attendees',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'Pakistan Sports Board',
            tagline: 'Developing champions and promoting sports culture nationwide.',
            logo: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1600&q=80',
            founded: '1962',
            employees: '500+',
            website: 'psb.gov.pk',
            totalEvents: 1000,
        },
    },
    {
        id: '9',
        title: 'EDM Night Neon Rave',
        date: 'Dec 08, 2024',
        time: '9:00 PM',
        location: 'Joyland, Lahore',
        category: 'Concert & Music',
        price: 'PKR 3,000',
        description: 'International DJs ke saath Lahore ka sab se roshaan raat — neon lights, laser shows, aur non-stop dance music. 18+ event.',
        capacity: '2,000 Attendees',
        image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8f1a4?auto=format&fit=crop&w=800&q=80',
        organizer: {
            name: 'NightLife Events',
            tagline: 'Lahore ki raatonko unforgettable banate hain.',
            logo: 'https://images.unsplash.com/photo-1571266028243-d220c6a8f1a4?auto=format&fit=crop&w=200&q=80',
            banner: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
            founded: '2017',
            employees: '25+',
            website: 'nightlifeevents.pk',
            totalEvents: 75,
        },
    },
];

// ─── Reusable: Company Stat Badge ────────────────────────────────────────────
// DRY: Company stats (Founded, Employees, etc.) ke liye ek reusable badge
const StatBadge = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col items-center gap-1 px-6 py-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 min-w-[90px]">
        <Icon size={18} className="text-amber-400" />
        <span className="text-white font-bold text-lg leading-tight">{value}</span>
        <span className="text-gray-300 text-xs">{label}</span>
    </div>
);

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

// ─── Main Component ───────────────────────────────────────────────────────────
const EventDetailPage = () => {
    // URL se event ID nikalo — e.g. /events/3 se id = '3'
    const { id } = useParams();
    const navigate = useNavigate();

    // ID se event dhundo — O(n) lookup, API pe replace hoga baad mein
    const event = ALL_EVENTS.find((ev) => ev.id === id);

    // ── Not Found State ──────────────────────────────────────────────────────
    // Agar koi event ID match nahi ki to user ko wapas events page bhejo
    if (!event) {
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

    const { title, date, time, location, category, price, description, capacity, image, organizer } = event;

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

                        {/* Company Stats — Founded, Employees, Events */}
                        <div className="flex gap-2 sm:gap-3 flex-wrap">
                            {/* DRY: StatBadge component reuse */}
                            <StatBadge icon={Building2} label="Founded" value={organizer.founded} />
                            <StatBadge icon={Users} label="Team Size" value={organizer.employees} />
                            <StatBadge icon={Calendar} label="Events" value={`${organizer.totalEvents}+`} />
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
                            href={`https://${organizer.website}`}
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
                        {/* Prominent CTA — user ka main action */}
                        <Link
                            to="/register"
                            className="block w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base rounded-2xl text-center shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 cursor-pointer"
                        >
                            Register Now — {price}
                        </Link>

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
        </div>
    );
};

export default EventDetailPage;
