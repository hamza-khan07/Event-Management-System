// frontend/src/pages/AllEventsPage.jsx
//
// RESPONSIBILITY: Dedicated "Explore All Events" page.
// Page structure:
//   1. Slim Hero  — Page title + subtitle
//   2. Search Bar — Events, venues, organizers search
//   3. Popular Categories — Quick filter chips
//   4. Main Layout:
//      - Left Sidebar: Filters (Category, Date, Location, Price)
//      - Right Content: Sort dropdown + Event Cards Grid
//
// DRY: Reuses the existing EventCard component.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import EventCard from '../components/landing/EventCard';
import { getPublicEvents } from '../services/eventService';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSearch = searchParams.get('search') || '';

    // Search input state
    const [searchQuery, setSearchQuery] = useState(urlSearch);

    // Sidebar filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedPrice, setSelectedPrice] = useState('All');

    // Sort dropdown state
    const [sortBy, setSortBy] = useState('Recommended');

    // Mobile sidebar toggle
    const [showFilters, setShowFilters] = useState(false);

    // ── API Data State ──────────────────────────────────────────────────────────
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Update search query when URL changes
    useEffect(() => {
        const queryFromUrl = searchParams.get('search');
        if (queryFromUrl !== null) {
            setSearchQuery(queryFromUrl);
        }
    }, [searchParams]);

    // ── Fetch Events from API ───────────────────────────────────────────────────
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { limit: 50 };
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (selectedCategory !== 'All') params.category = selectedCategory;
            if (selectedPrice === 'Free') params.price = 'Free';
            else if (selectedPrice === 'Paid') params.price = 'Paid';

            const data = await getPublicEvents(params);
            setEvents(data.data || []);
        } catch {
            setError('Failed to load events. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedCategory, selectedPrice]);

    // Re-fetch events on mount and whenever dependencies change
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Client-side filtering & sorting on fetched data
    const displayedEvents = useMemo(() => {
        let list = [...events];

        // Date filter
        if (selectedDate) {
            list = list.filter((ev) => {
                if (!ev.event_date) return false;
                const d = new Date(ev.event_date).toISOString().split('T')[0];
                return d === selectedDate;
            });
        }

        // Location filter
        if (selectedLocation.trim()) {
            const loc = selectedLocation.toLowerCase().trim();
            list = list.filter((ev) => (ev.venue || '').toLowerCase().includes(loc));
        }

        // Sorting
        if (sortBy === 'Date: Nearest First') {
            list.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        } else if (sortBy === 'Price: Low to High') {
            list.sort((a, b) => {
                const pA = parseFloat(a.price) || 0;
                const pB = parseFloat(b.price) || 0;
                return pA - pB;
            });
        } else if (sortBy === 'Price: High to Low') {
            list.sort((a, b) => {
                const pA = parseFloat(a.price) || 0;
                const pB = parseFloat(b.price) || 0;
                return pB - pA;
            });
        }

        return list;
    }, [events, selectedDate, selectedLocation, sortBy]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedDate('');
        setSelectedLocation('');
        setSelectedPrice('All');
        setSortBy('Recommended');
        setSearchParams({});
    };

    // Check if any filters are currently active (to display reset button)
    const hasActiveFilters =
        searchQuery ||
        selectedCategory !== 'All' ||
        selectedDate ||
        selectedLocation ||
        selectedPrice !== 'All';

    // Result count based on filtered events
    const resultCount = displayedEvents.length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Shared Navbar */}
            <Navbar />

            {/* ── 1. SLIM HERO ─────────────────────────────────────────────── */}
            <section className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 pt-28 pb-14 text-center px-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Explore <span className="text-amber-400">Events</span>
                </h1>
                <p className="mt-3 text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
                    Find your next experience — concerts, workshops, tech summits and more.
                </p>
            </section>

            {/* ── 3. POPULAR CATEGORIES ────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Popular Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
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
                            <span className="ml-2 text-sm font-normal text-gray-400">
                                ({loading ? '...' : `${resultCount} results`})
                            </span>
                        </h2>
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
                    <aside
                        className={`
                            w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            lg:block
                            ${showFilters ? 'block' : 'hidden'}
                            fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto
                            overflow-y-auto lg:overflow-visible
                        `}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                                Filters
                            </h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="lg:hidden text-gray-400 hover:text-gray-700 cursor-pointer"
                                aria-label="Close filters"
                            >
                                <X size={18} />
                            </button>
                        </div>

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


                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="w-full mt-2 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 cursor-pointer transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </aside>

                    {showFilters && (
                        <div
                            className="lg:hidden fixed inset-0 bg-black/40 z-30"
                            onClick={() => setShowFilters(false)}
                        />
                    )}

                    {/* ── RIGHT: EVENTS GRID ────────────────────────────────── */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={36} className="animate-spin text-indigo-500" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <p className="text-red-500 font-semibold mb-3">{error}</p>
                                <button
                                    onClick={fetchEvents}
                                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl cursor-pointer"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : displayedEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {displayedEvents.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
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


            {/* Shared Footer */}
            <Footer />

        </div>
    );
};

export default AllEventsPage;
