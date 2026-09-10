// frontend/src/pages/OrganizerParticipantsPage.jsx
//
// RESPONSIBILITY: Display all registered participants across all events of an organizer.
//
// Design Pattern:
//   Similar to MyEventsPage — Sidebar + filters bar + table + drawer + pagination.
//   Maintains a consistent UX pattern throughout the Organizer portal.
//
// Flow:
//   Organizer → Sidebar "My Participants" → Page loads
//   Filters change → re-fetch → table updates
//   Row click → Drawer slides in → displays full participant details

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';
import Drawer from '../components/drawer';


// ─────────────────────────────────────────────────────────────────
// HELPER: RegistrationStatusBadge
// REGISTERED → green,  CANCELLED → red
// ─────────────────────────────────────────────────────────────────
const RegistrationStatusBadge = ({ status }) => {
    const styles = {
        REGISTERED: 'bg-emerald-100 text-emerald-700',
        CANCELLED:  'bg-red-100 text-red-600',
    };
    return (
        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────
// HELPER: InfoRow (label-value pairs inside drawer)
// Same pattern as MyEventsPage — DRY
// ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-500 font-medium min-w-[130px]">{label}</span>
        <span className="text-xs text-gray-800 text-right font-medium">{value || '—'}</span>
    </div>
);


// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const OrganizerParticipantsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────
    const [participants, setParticipants] = useState([]);
    const [eventsList, setEventsList]     = useState([]);   // For filter dropdown
    const [loading, setLoading]           = useState(false);

    const [search,       setSearch]       = useState('');
    const [eventIdFilter, setEventIdFilter] = useState(''); // '' = all events
    const [statusFilter, setStatusFilter] = useState('');   // '' = all, REGISTERED, CANCELLED

    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
    const [limit, setLimit] = useState(10);

    // Detail drawer state
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Fetch Participants ────────────────────────────────────────
    const fetchParticipants = useCallback(async (
        searchTerm = '', eventId = '', status = '', page = 1, currentLimit = 10
    ) => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/organizer/my-participants', {
                params: {
                    search:  searchTerm,
                    eventId: eventId || undefined,
                    status:  status  || undefined,
                    page,
                    limit:   currentLimit
                },
                withCredentials: true
            });

            if (res.data.success) {
                setParticipants(res.data.data);
                // Set events list on initial load or if list is empty
                // Backend provides fresh data for the dropdown
                if (res.data.events) {
                    setEventsList(res.data.events);
                }
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages:  res.data.pagination.totalPages,
                    total:       res.data.pagination.total
                });
            }
        } catch (err) {
            console.error('Failed to fetch participants:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Re-fetch when filters, page, or limit changes
    useEffect(() => {
        fetchParticipants(search, eventIdFilter, statusFilter, pagination.currentPage, limit);
    }, [search, eventIdFilter, statusFilter, pagination.currentPage, limit]);

    // ── Row Click: Participant detail drawer ──────────────────────
    const handleRowClick = (participant) => {
        setSelectedParticipant(participant);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedParticipant(null);
    };

    // ── Date Formatter ────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // ── DateTime Formatter (registered_at timestamp) ─────────────
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };


    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">

                {/* ── Header ── */}
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Participants</h1>
                        <p className="text-xs text-gray-500 mt-1">
                            View all users registered in your company's events.
                        </p>
                    </div>
                    {/* Total count badge */}
                    {!loading && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                            <span className="text-blue-600 font-bold text-lg">{pagination.total}</span>
                            <span className="text-blue-400 text-xs font-medium">Total Participants</span>
                        </div>
                    )}
                </header>

                {/* ── Filters Bar ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(p => ({ ...p, currentPage: 1 }));
                        }}
                        className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Event Filter dropdown */}
                        <select
                            value={eventIdFilter}
                            onChange={(e) => {
                                setEventIdFilter(e.target.value);
                                setPagination(p => ({ ...p, currentPage: 1 }));
                            }}
                            className="border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px]"
                        >
                            <option value="">All Events</option>
                            {eventsList.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title}
                                </option>
                            ))}
                        </select>

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
                            <option value="REGISTERED">Registered</option>
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
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Participants Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-gray-500 p-6">Loading participants...</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 bg-slate-50">
                                    <th className="p-4 font-semibold">#</th>
                                    <th className="p-4 font-semibold">Participant</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Event</th>
                                    <th className="p-4 font-semibold">Event Date</th>
                                    <th className="p-4 font-semibold text-center">Tickets</th>
                                    <th className="p-4 font-semibold">Reg. Code</th>
                                    <th className="p-4 font-semibold">Registered At</th>
                                    <th className="p-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-10 text-center">
                                            <p className="text-sm text-gray-400 mb-1">No participants found.</p>
                                            <p className="text-xs text-gray-300">
                                                {search || eventIdFilter || statusFilter
                                                    ? 'Try changing or clearing the filters.'
                                                    : 'No one has registered for your events yet.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : participants.map((p, idx) => (
                                    <tr
                                        key={p.registration_id}
                                        onClick={() => handleRowClick(p)}
                                        className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        {/* Row number */}
                                        <td className="p-4 text-xs text-gray-400 font-medium">
                                            {(pagination.currentPage - 1) * limit + idx + 1}
                                        </td>
                                        {/* Participant name + initials avatar */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {p.participant_name?.slice(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 max-w-[130px] block truncate">
                                                    {p.participant_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 max-w-[160px]">
                                            <span className="block truncate">{p.participant_email}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 max-w-[160px]">
                                            <span className="block truncate font-medium">{p.event_title}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDate(p.event_date)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {p.ticket_count}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                {p.registration_code || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                                            {formatDateTime(p.registered_at)}
                                        </td>
                                        <td className="p-4">
                                            <RegistrationStatusBadge status={p.registration_status} />
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
                                ? `${pagination.total} participant${pagination.total !== 1 ? 's' : ''} found — Page ${pagination.currentPage} of ${pagination.totalPages}`
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

            {/* ── Participant Detail Drawer ── */}
            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={selectedParticipant?.participant_name}
                subtitle={selectedParticipant?.participant_email}
            >
                {selectedParticipant && (
                    <>
                        {/* Registration Status */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Registration Status
                            </h3>
                            <RegistrationStatusBadge status={selectedParticipant.registration_status} />
                        </div>

                        {/* Participant Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Participant Details
                            </h3>
                            <div>
                                <InfoRow label="Name"   value={selectedParticipant.participant_name} />
                                <InfoRow label="Email"  value={selectedParticipant.participant_email} />
                                <InfoRow label="Phone"  value={selectedParticipant.phone_number} />
                            </div>
                        </div>

                        {/* Registration Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Registration Details
                            </h3>
                            <div>
                                <InfoRow label="Registration Code" value={selectedParticipant.registration_code} />
                                <InfoRow label="Tickets"           value={selectedParticipant.ticket_count?.toString()} />
                                <InfoRow label="Registered At"     value={formatDateTime(selectedParticipant.registered_at)} />
                            </div>
                        </div>

                        {/* Event Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Event Details
                            </h3>
                            <div>
                                <InfoRow label="Event Name" value={selectedParticipant.event_title} />
                                <InfoRow label="Event Date" value={formatDate(selectedParticipant.event_date)} />
                            </div>
                        </div>
                    </>
                )}
            </Drawer>
        </div>
    );
};

export default OrganizerParticipantsPage;
