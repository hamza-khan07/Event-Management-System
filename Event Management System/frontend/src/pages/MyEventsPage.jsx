// frontend/src/pages/MyEventsPage.jsx
//
// RESPONSIBILITY: Organizer ki saari events ek table mein dikhana.
//
// Design Pattern:
//   Bilkul same jaise CompaniesPage — Sidebar + table + search +
//   pagination. Farq sirf yeh hai ke yahan "Create Event" button hai
//   jo /organizer/events/create pe navigate karta hai.
//
// Flow:
//   Organizer → Sidebar "My Events" → MyEventsPage (table)
//                                         ↓ "Create Event" button click
//                                     CreateEventPage (form)
//                                         ↓ submit
//                                     Wapas MyEventsPage pe redirect
//
// DRY: Drawer component reuse, EventStatusBadge reuse, same pagination
//      pattern jo CompaniesPage mein use hua.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';
import Drawer from '../components/drawer';

// ─────────────────────────────────────────────────────────────────
// REUSABLE: EventStatusBadge
// Kyun: Status badge 3 jagah use hoga — table row, drawer header,
// aur future pages. Ek component, props se control (DRY).
//
// Event 3 statuses hoti hain:
//   DRAFT       → gray    (abhi visible nahi)
//   PUBLISHED   → green   (open for registrations)
//   CANCELLED   → red     (band kar di)
// ─────────────────────────────────────────────────────────────────
const EventStatusBadge = ({ status }) => {
    const styles = {
        PUBLISHED: 'bg-emerald-100 text-emerald-700',
        DRAFT: 'bg-gray-100 text-gray-600',
        CANCELLED: 'bg-red-100 text-red-600',
    };
    return (
        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${styles[status] || styles.DRAFT}`}>
            {status}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────
// REUSABLE: InfoRow (Drawer ke andar label-value pairs ke liye)
// Kyun: Drawer mein event details label/value pattern repeat hota —
// DRY: ek component, baar baar use karo.
// ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-500 font-medium min-w-[110px]">{label}</span>
        <span className="text-xs text-gray-800 text-right font-medium">{value || '—'}</span>
    </div>
);


// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const MyEventsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');     // DRAFT / PUBLISHED / CANCELLED / ''
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
    const [limit, setLimit] = useState(10);

    // Detail drawer state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Fetch Events ────────────────────────────────────────────
    // useCallback: function reference stable rakhta hai
    // taake useEffect infinite loop mein na jaaye
    const fetchEvents = useCallback(async (searchTerm = '', status = '', page = 1, currentLimit = 10) => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/events/my-events', {
                params: {
                    search: searchTerm,
                    status,            // '' = sab, 'DRAFT' = sirf drafts, etc.
                    page,
                    limit: currentLimit
                },
                withCredentials: true
            });
            if (res.data.success) {
                setEvents(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages,
                    total: res.data.pagination.total
                });
            }
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Search, filter, page, ya limit change hone par re-fetch
    useEffect(() => {
        fetchEvents(search, statusFilter, pagination.currentPage, limit);
    }, [search, statusFilter, pagination.currentPage, limit]);
    // Note: fetchEvents useCallback mein hai isliye yeh stable hai —
    // infinite re-render nahi hoga.

    // ── Row Click: Event detail drawer ──────────────────────────
    // Row click karo → drawer mein us event ki full detail aaye.
    // Hum already table mein saara data hai, toh API call avoid karo.
    // (Bari list mein JOIN data hota hai — drawer ke liye extra call
    //  nahi chahiye abhi, direct selected data use karo)
    const handleRowClick = (event) => {
        setSelectedEvent(event);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedEvent(null);
    };

    // ── Status Change (from Drawer) ──────────────────────────────
    // Organizer drawer mein se event status toggle kar sakta hai
    // (DRAFT ↔ PUBLISHED, ya PUBLISHED → CANCELLED)
    const handleStatusChange = async (eventId, newStatus) => {
        setStatusUpdating(true);
        try {
            await axios.put(
                `http://localhost:5000/api/events/${eventId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            // Local state update — page reload avoid karo
            setEvents(prev =>
                prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e)
            );
            // Drawer mein bhi update karo
            setSelectedEvent(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err) {
            console.error('Failed to update event status:', err);
        } finally {
            setStatusUpdating(false);
        }
    };

    // ── Delete Event (from Drawer) ──────────────────────────────
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to permanently delete this DRAFT event? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await axios.delete(
                `http://localhost:5000/api/events/${eventId}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                // Remove from local state
                setEvents(prev => prev.filter(e => e.id !== eventId));
                closeDrawer();
                // Optionally show a toast here
                alert('Event deleted successfully.');
            }
        } catch (err) {
            console.error('Failed to delete event:', err);
            alert(err.response?.data?.message || 'Failed to delete event.');
        }
    };

    // ── Date formatter (DRY helper) ──────────────────────────────
    // Har jagah alag format likhne ki zaroorat nahi
    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

    const formatTime = (timeStr) => {
        // "09:00:00" → "9:00 AM"
        if (!timeStr) return '—';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };


    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">

                {/* ── Header: Title + Create Event Button ── */}
                {/* Yahan "Create Event" button hai — bilkul upar right side mein.
                    Click karo → /organizer/events/create pe navigate karo.
                    Yahi pattern hai: list page + action button = standard UX. */}
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Events</h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Manage all events created by your company.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/organizer/events/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
                    >
                        <span className="text-base leading-none">+</span>
                        Create Event
                    </button>
                </header>

                {/* ── Filters Bar ── */}
                {/* Search + Status Filter + Rows per page — ek row mein.
                    Status filter extra hai (companies mein nahi tha) kyunke
                    events ke 3 statuses hain — organizer filter karna chahega. */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by title or venue..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(p => ({ ...p, currentPage: 1 })); // Page 1 par reset
                        }}
                        className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(p => ({ ...p, currentPage: 1 }));
                            }}
                            className="border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Rows per page */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                Rows:
                            </label>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPagination(p => ({ ...p, currentPage: 1 }));
                                }}
                                className="border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Events Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-gray-500 p-6">Loading events...</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 bg-slate-50">
                                    <th className="p-4 font-semibold">Event Title</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Venue</th>
                                    {/* Registrations: "5 / 100" format — filled / capacity */}
                                    <th className="p-4 font-semibold text-center">Registrations</th>
                                    <th className="p-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center">
                                            <p className="text-sm text-gray-400 mb-2">No events found.</p>
                                            <button
                                                onClick={() => navigate('/organizer/events/create')}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                + Create your first event
                                            </button>
                                        </td>
                                    </tr>
                                ) : events.map((event) => (
                                    <tr
                                        key={event.id}
                                        onClick={() => handleRowClick(event)}
                                        className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        {/* Title: max-width + truncate — lambi title table break na kare */}
                                        <td className="p-4 text-sm font-medium text-gray-900 max-w-[200px]">
                                            <span className="block truncate">{event.title}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {event.category || '—'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDate(event.event_date)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 max-w-[150px]">
                                            <span className="block truncate">{event.venue || '—'}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {event.registrations}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                /{event.capacity}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <EventStatusBadge status={event.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* ── Pagination ── */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            {pagination.total > 0
                                ? `${pagination.total} event${pagination.total !== 1 ? 's' : ''} found — Page ${pagination.currentPage} of ${pagination.totalPages}`
                                : 'No results'
                            }
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                                disabled={pagination.currentPage === 1}
                                className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-40 hover:bg-blue-700 transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Event Detail Drawer ── */}
            {/* Reusable Drawer component — bilkul same jaise CompaniesPage mein.
                Row click karo → drawer slide in → event ki full detail.
                Footer mein status change buttons hain. */}
            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={selectedEvent?.title}
                subtitle={selectedEvent ? formatDate(selectedEvent.event_date) : ''}
                footer={
                    selectedEvent && (
                        <div className="space-y-2">
                            {/* Publish / Unpublish button */}
                            {selectedEvent.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleStatusChange(selectedEvent.id, 'PUBLISHED')}
                                    disabled={statusUpdating}
                                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-60"
                                >
                                    {statusUpdating ? 'Updating...' : '↑ Publish Event'}
                                </button>
                            )}
                            {selectedEvent.status === 'PUBLISHED' && (
                                <button
                                    onClick={() => handleStatusChange(selectedEvent.id, 'CANCELLED')}
                                    disabled={statusUpdating}
                                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-60"
                                >
                                    {statusUpdating ? 'Updating...' : 'Cancel Event'}
                                </button>
                            )}
                            {/* Edit Event — Passes event data in state so we don't need another API call */}
                            <button
                                onClick={() => navigate(`/organizer/events/edit/${selectedEvent.id}`, { state: { event: selectedEvent } })}
                                className="w-full py-2.5 rounded-xl font-semibold text-sm transition bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                            >
                                ✎ Edit Event
                            </button>

                            {/* Delete Event — Only for DRAFT events */}
                            {selectedEvent.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition bg-white text-gray-500 hover:bg-gray-50 hover:text-red-600 border border-gray-200 mt-4"
                                >
                                    🗑 Delete Event
                                </button>
                            )}
                        </div>
                    )
                }
            >
                {/* Drawer Body — Event Details */}
                {selectedEvent && (
                    <>
                        {/* Status + Badge */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Event Status
                            </h3>
                            <EventStatusBadge status={selectedEvent.status} />
                        </div>

                        {/* Event Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Event Details
                            </h3>
                            <div>
                                <InfoRow label="Category" value={selectedEvent.category} />
                                <InfoRow label="Date" value={formatDate(selectedEvent.event_date)} />
                                <InfoRow label="Start Time" value={formatTime(selectedEvent.start_time)} />
                                <InfoRow label="End Time" value={formatTime(selectedEvent.end_time)} />
                                <InfoRow label="Venue" value={selectedEvent.venue} />
                                <InfoRow label="Capacity" value={selectedEvent.capacity?.toString()} />
                                <InfoRow
                                    label="Registrations"
                                    value={`${selectedEvent.registrations} registered`}
                                />
                                <InfoRow
                                    label="Fill Rate"
                                    value={
                                        selectedEvent.capacity > 0
                                            ? `${Math.round((selectedEvent.registrations / selectedEvent.capacity) * 100)}%`
                                            : '—'
                                    }
                                />
                            </div>
                        </div>
                    </>
                )}
            </Drawer>
        </div>
    );
};

export default MyEventsPage;
