import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';
import Drawer from '../components/drawer';

const ParticipantsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [limit, setLimit] = useState(10);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    useEffect(() => {
        fetchParticipants(search, pagination.currentPage, limit);
    }, [search, pagination.currentPage, limit]);

    // ─── API: Participant list ────────────────────────────────────
    // role=PARTICIPANT — same endpoint, alag role parameter
    const fetchParticipants = async (searchTerm = '', page = 1, currentLimit = 10) => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/users', {
                params: { role: 'PARTICIPANT', search: searchTerm, page, limit: currentLimit },
                withCredentials: true
            });
            if (res.data.success) {
                setParticipants(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages
                });
            }
        } catch (err) {
            console.error('Failed to fetch participants:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── API: Single participant detail ──────────────────────────
    const handleRowClick = async (userId) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/users/${userId}`,
                { withCredentials: true }
            );
            if (res.data.success) {
                setSelectedParticipant(res.data.data);
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch participant detail:', err);
        }
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedParticipant(null);
    };

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Participants</h1>
                    <p className="text-xs text-gray-500 mt-1">View all participants registered on the platform.</p>
                </header>

                {/* Search Bar & Limit */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(p => ({ ...p, currentPage: 1 }));
                        }}
                        className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">Rows per page:</label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPagination(p => ({ ...p, currentPage: 1 }));
                            }}
                            className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>

                {/* Participants Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-gray-500 p-6">Loading participants...</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 bg-slate-50">
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Joined</th>
                                    <th className="p-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-sm text-gray-400">
                                            No participants found.
                                        </td>
                                    </tr>
                                ) : participants.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => handleRowClick(p.id)}
                                        className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-900">{p.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{p.email}</td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${p.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            Page {pagination.currentPage} of {pagination.totalPages}
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

            {/* Detail Drawer */}
            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={selectedParticipant?.name}
                subtitle={selectedParticipant?.email}
            >
                {selectedParticipant && (
                    <>
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Participant Info
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(selectedParticipant.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${selectedParticipant.status === 'ACTIVE'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {selectedParticipant.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Registrations Section */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Event Registrations ({selectedParticipant.registrations?.length || 0})
                            </h3>
                            {(!selectedParticipant.registrations || selectedParticipant.registrations.length === 0) ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                    No event registrations found.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedParticipant.registrations.map((reg) => (
                                        <div key={reg.id} className="p-3 bg-slate-50 border border-gray-100 rounded-lg">
                                            <p className="text-sm font-medium text-gray-900">{reg.event_title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(reg.event_date).toLocaleDateString()}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reg.status === 'REGISTERED'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Drawer>
        </div>
    );
};

export default ParticipantsPage;
