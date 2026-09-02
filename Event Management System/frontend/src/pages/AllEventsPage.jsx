// frontend/src/pages/AllEventsPage.jsx
//
// RESPONSIBILITY: Dedicated "Explore All Events" page.
// Wireframe ke mutabiq yeh page contain karta hai:
//   1. Slim Hero  — Page title + subtitle
//   2. Search Bar — Events, venues, organizers search
//   3. Popular Categories — Quick filter chips
//   4. Main Layout:
//      - Left Sidebar: Filters (Category, Date, Location, Price)
//      - Right Content: Sort dropdown + Event Cards Grid
//
// DRY: Existing EventCard component reuse kiya gaya hai.

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Calendar } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import EventCard from '../components/landing/EventCard'; // DRY: reuse existing card

// ─── Static Events Data ───────────────────────────────────────────────────────
// Har event mein `organizer` field hai jo EventDetailPage mein company section ke liye use hoti hai.
// Aage is pure array ko backend API se replace kiya ja sakta hai.
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
            tagline: 'Bridging Pakistan\'s tech talent with global opportunities.',
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
            tagline: 'Pakistan\'s premier startup incubator fueling entrepreneurship.',
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

// ─── Constants ────────────────────────────────────────────────────────────────

// Popular category chips — wireframe mein clearly dikhaye gaye hain
const POPULAR_CATEGORIES = ['Music', 'Technology', 'Food', 'Art', 'Business', 'Sports'];

// Sidebar filter options
const CATEGORIES = [
    'All',
    'Concert & Music',
    'Technology',
    'Food & Drinks',
    'Art & Culture',
    'Business & Networking',
    'Sports',
    'Entertainment',
    'Exhibition',
    'Workshop',
    'Festival'
];
const PRICE_OPTIONS = ['All', 'Free', 'Paid'];
const SORT_OPTIONS = [
    'Recommended',
    'Date: Nearest First',
    'Price: Low to High',
    'Price: High to Low',
];

// ─── Main Component ───────────────────────────────────────────────────────────
const AllEventsPage = () => {
    // Search input state
    const [searchQuery, setSearchQuery] = useState('');

    // Sidebar filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedPrice, setSelectedPrice] = useState('All');

    // Sort dropdown state
    const [sortBy, setSortBy] = useState('Recommended');

    // Mobile sidebar toggle
    const [showFilters, setShowFilters] = useState(false);

    // ── Filtering Logic ──────────────────────────────────────────────────────
    // useMemo: sirf jab dependencies change hon tab recalculate karo (performance)
    const filteredEvents = useMemo(() => {
        return ALL_EVENTS.filter((ev) => {
            const q = searchQuery.toLowerCase().trim();

            // 1. Search query match — title, location, ya category mein
            const matchesSearch =
                !q ||
                ev.title.toLowerCase().includes(q) ||
                ev.location.toLowerCase().includes(q) ||
                ev.category.toLowerCase().includes(q);

            // 2. Category filter
            const matchesCategory =
                selectedCategory === 'All' ||
                ev.category.toLowerCase().includes(selectedCategory.toLowerCase());

            // 3. Location filter — user jo type kare us se match
            const matchesLocation =
                !selectedLocation.trim() ||
                ev.location.toLowerCase().includes(selectedLocation.toLowerCase());

            // 4. Price filter — Free ya Paid
            const matchesPrice =
                selectedPrice === 'All' ||
                (selectedPrice === 'Free' ? ev.price === 'Free' : ev.price !== 'Free');

            return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
        });
    }, [searchQuery, selectedCategory, selectedLocation, selectedPrice]);

    // ── Reset All Filters — DRY: ek hi function se sab reset ────────────────
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedDate('');
        setSelectedLocation('');
        setSelectedPrice('All');
        setSortBy('Recommended');
    };

    // Check karo koi filter active hai ya nahi (reset button dikhane ke liye)
    const hasActiveFilters =
        searchQuery ||
        selectedCategory !== 'All' ||
        selectedDate ||
        selectedLocation ||
        selectedPrice !== 'All';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Shared Navbar — DRY: existing component reuse */}
            <Navbar />

            {/* ── 1. SLIM HERO ─────────────────────────────────────────────── */}
            {/* Wireframe: "Slim Event Hero Image" — gradient background, centered text */}
            <section className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 pt-28 pb-14 text-center px-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Explore <span className="text-amber-400">Events</span>
                </h1>
                <p className="mt-3 text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
                    Find your next experience — concerts, workshops, tech summits and more.
                </p>
            </section>



            {/* ── 3. POPULAR CATEGORIES ────────────────────────────────────── */}
            {/* Wireframe: "[Music] [Technology] [Food] [Art] [Business] [Sports]" */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Popular Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                // Click par sidebar category filter bhi update ho — DRY: shared state
                                onClick={() =>
                                    setSelectedCategory(selectedCategory === cat ? 'All' : cat)
                                }
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer
                                    ${selectedCategory === cat
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                    }`}
                            >
                                [{cat}]
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 4. MAIN CONTENT ──────────────────────────────────────────── */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

                {/* Top Bar: heading + Sort + Mobile filter button */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">
                            All Events
                            {/* Results count — user ko pata chale kitne events filtered hain */}
                            <span className="ml-2 text-sm font-normal text-gray-400">
                                ({filteredEvents.length} results)
                            </span>
                        </h2>
                        {/* Active filters hone par "Reset" link dikhao */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="text-xs text-indigo-600 hover:underline cursor-pointer font-medium"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* ── 2. SEARCH BAR ────────────────────────────────────────────── */}
                    {/* Wireframe: "Search events, venues, organizers..." */}

                    <div className="max-w-3xl flex-1 mx-2  relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search events, venues, organizers..."
                            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                        {/* Clear button — sirf jab kuch likha ho tabhi dikhao */}
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>


                    <div className="flex items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <ChevronDown
                                size={14}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                        </div>

                        {/* Mobile Filters Toggle — sirf small screens par dikhao */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-indigo-400 cursor-pointer transition"
                        >
                            <SlidersHorizontal size={15} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="flex gap-8 items-start">

                    {/* ── LEFT SIDEBAR: FILTERS ─────────────────────────────── */}
                    {/* Wireframe: "FILTERS | Category | Date | Location | Price" */}
                    <aside
                        className={`
                            w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            lg:block
                            ${showFilters ? 'block' : 'hidden'}
                            fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto
                            overflow-y-auto lg:overflow-visible
                        `}
                    >
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                                Filters
                            </h3>
                            {/* Mobile close button */}
                            <button
                                onClick={() => setShowFilters(false)}
                                className="lg:hidden text-gray-400 hover:text-gray-700 cursor-pointer"
                                aria-label="Close filters"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Filter 1: Category */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Category
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`text-left text-sm px-3 py-2 rounded-lg transition-all cursor-pointer
                                            ${selectedCategory === cat
                                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Filter 2: Date */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Date
                            </p>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 cursor-pointer"
                            />
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Filter 3: Location */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Location
                            </p>
                            <input
                                type="text"
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                placeholder="e.g. Lahore, Karachi..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                            />
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Filter 4: Price */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Price
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {PRICE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setSelectedPrice(opt)}
                                        className={`text-left text-sm px-3 py-2 rounded-lg transition-all cursor-pointer
                                            ${selectedPrice === opt
                                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reset button — sirf active filters hone par dikhao */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="w-full mt-2 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 cursor-pointer transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </aside>

                    {/* Mobile overlay — filters sidebar open hone par background dim */}
                    {showFilters && (
                        <div
                            className="lg:hidden fixed inset-0 bg-black/40 z-30"
                            onClick={() => setShowFilters(false)}
                        />
                    )}

                    {/* ── RIGHT: EVENTS GRID ────────────────────────────────── */}
                    <div className="flex-1 min-w-0">
                        {filteredEvents.length > 0 ? (
                            // Grid: sm=1col, md=2col, xl=3col
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredEvents.map((event) => (
                                    // DRY: existing EventCard reuse — duplicate nahi kiya
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            // Empty state — koi event nahi mila
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <Calendar className="mx-auto text-gray-200 mb-4" size={48} />
                                <h4 className="text-lg font-bold text-gray-700">No events found</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-5">
                                    Try adjusting your filters or search term.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer transition"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer — DRY: existing component reuse */}
            <Footer />
        </div>
    );
};

export default AllEventsPage;
