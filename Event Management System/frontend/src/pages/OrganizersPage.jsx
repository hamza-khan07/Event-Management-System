// frontend/src/pages/OrganizersPage.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';
import Drawer from '../components/drawer';

const OrganizersPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State: data, loading, search, pagination, drawer
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [limit, setLimit] = useState(10);
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Search, page, ya limit change hote hi data dobara fetch karo
    useEffect(() => {
        fetchOrganizers(search, pagination.currentPage, limit);
    }, [search, pagination.currentPage, limit]);

    // ─── API: Organizer list fetch ────────────────────────────────
    // role=ORGANIZER query param pass kar rahe hain — same endpoint dono pages use karenge
    const fetchOrganizers = async (searchTerm = '', page = 1, currentLimit = 10) => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/users', {
                params: { role: 'ORGANIZER', search: searchTerm, page, limit: currentLimit },
                withCredentials: true
            });
            if (res.data.success) {
                setOrganizers(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages
                });
            }
        } catch (err) {
            console.error('Failed to fetch organizers:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── API: Status toggle ───────────────────────────────────────
    const handleStatusChange = async (userId, newStatus) => {
        try {
            await axios.put(
                `http://localhost:5000/api/users/${userId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            // Local state update karo (page reload ki zaroorat nahi)
            setOrganizers(prev =>
                prev.map(o => o.id === userId ? { ...o, status: newStatus } : o)
            );
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // ─── API: Single organizer detail for drawer ──────────────────
    const handleRowClick = async (userId) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/users/${userId}`,
                { withCredentials: true }
            );
            if (res.data.success) {
                setSelectedOrganizer(res.data.data);
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch organizer detail:', err);
        }
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedOrganizer(null);
    };

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Organizers</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage all organizers registered on the platform.</p>
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

                {/* Organizers Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-gray-500 p-6">Loading organizers...</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 bg-slate-50">
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Company</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-sm text-gray-400">
                                            No organizers found.
                                        </td>
                                    </tr>
                                ) : organizers.map((org) => (
                                    <tr
                                        key={org.id}
                                        onClick={() => handleRowClick(org.id)}
                                        className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-900">{org.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{org.email}</td>
                                        {/* Company name: LEFT JOIN se aaya hai backend mein */}
                                        <td className="p-4 text-sm text-gray-500">{org.company_name || '—'}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${org.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {org.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Row click rok do, sirf button kaam kare
                                                    handleStatusChange(org.id, org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                                }}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${org.status === 'ACTIVE'
                                                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination Controls */}
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

            {/* Reusable Drawer — Company drawer se bilkul same component */}
            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={selectedOrganizer?.name}
                subtitle={selectedOrganizer?.email}
                footer={
                    selectedOrganizer && (
                        <button
                            onClick={async () => {
                                const newStatus = selectedOrganizer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                await handleStatusChange(selectedOrganizer.id, newStatus);
                                setSelectedOrganizer(prev => ({ ...prev, status: newStatus }));
                            }}
                            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${selectedOrganizer.status === 'ACTIVE'
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                        >
                            {selectedOrganizer.status === 'ACTIVE' ? 'Suspend Organizer' : 'Activate Organizer'}
                        </button>
                    )
                }
            >
                {selectedOrganizer && (
                    <>
                        {/* Basic Info Section */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Organizer Info
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500">Company</span>
                                    <span className="font-medium text-gray-800">{selectedOrganizer.company_name || '—'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(selectedOrganizer.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${selectedOrganizer.status === 'ACTIVE'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {selectedOrganizer.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Events Section */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Recent Events ({selectedOrganizer.recentEvents?.length || 0})
                            </h3>
                            {(!selectedOrganizer.recentEvents || selectedOrganizer.recentEvents.length === 0) ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                    No events found for this company.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedOrganizer.recentEvents.map((event) => (
                                        <div key={event.id} className="p-3 bg-slate-50 border border-gray-100 rounded-lg">
                                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(event.event_date).toLocaleDateString()}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.status === 'PUBLISHED'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : event.status === 'DRAFT'
                                                        ? 'bg-gray-100 text-gray-600'
                                                        : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {event.status}
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

export default OrganizersPage;
