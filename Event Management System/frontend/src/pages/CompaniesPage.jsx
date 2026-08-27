// frontend/src/pages/CompaniesPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';
import Drawer from '../components/drawer';

const CompaniesPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State: Companies data, loading, search input, aur pagination
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [limit, setLimit] = useState(10); // [NEW] Limit ke liye state bana li
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Jab bhi search, page ya limit change ho, data dobara fetch karo
    useEffect(() => {
        fetchCompanies(search, pagination.currentPage, limit);
    }, [search, pagination.currentPage, limit]);

    const fetchCompanies = async (searchTerm = '', page = 1, currentLimit = 10) => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/companies', {
                params: { search: searchTerm, page, limit: currentLimit }, // Yahan dynamic limit pass hogi
                withCredentials: true
            });

            if (res.data.success) {
                setCompanies(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages
                });
            }
        } catch (err) {
            console.error('Failed to fetch companies:', err);
        } finally {
            setLoading(false);
        }
    };

    // Status change handler (Activate / Suspend)
    const handleStatusChange = async (companyId, newStatus) => {
        try {
            await axios.put(
                `http://localhost:5000/api/companies/${companyId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            // API call ke baad local state bhi update karo (page reload na hona pade)
            setCompanies(prev =>
                prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c)
            );
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Row click hone par company detail fetch karo
    const handleRowClick = async (companyId) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/companies/${companyId}`,
                { withCredentials: true }
            );
            if (res.data.success) {
                setSelectedCompany(res.data.data); // data state mein set karo
                setDrawerOpen(true);               // drawer kholo
            }
        } catch (err) {
            console.error('Failed to fetch company detail:', err);
        }
    };

    // Drawer band karo
    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedCompany(null);
    };



    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            {/* Reusable Sidebar — Same component jo Dashboard par use kiya */}
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Companies</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage all registered companies on the platform.</p>
                </header>

                {/* Search Bar & Limit Dropdown */}
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

                    {/* Rows per page Dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">Rows per page:</label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                // Limit change hone par page 1 par wapis le aao
                                setPagination(p => ({ ...p, currentPage: 1 }));
                            }}
                            className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={2}>2</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-gray-500 p-6">Loading companies...</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 bg-slate-50">
                                    <th className="p-4 font-semibold">Company Name</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-sm text-gray-400">No companies found.</td>
                                    </tr>
                                ) : companies.map((company) => (
                                    <tr key={company.id} onClick={() => handleRowClick(company.id)} className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer">
                                        <td className="p-4 text-sm font-medium text-gray-900">{company.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{company.email}</td>
                                        <td className="p-4">
                                            {/* Status Badge — check strictly uppercase 'ACTIVE' */}
                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${company.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* Toggle Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Row click ko rokna — sirf button ka kaam hoga
                                                    handleStatusChange(company.id, company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                                }}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${company.status === 'ACTIVE'
                                                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {company.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
            {/* Reusable Generic Drawer for Company Details */}
            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={selectedCompany?.name}
                subtitle={selectedCompany?.email}
                footer={
                    selectedCompany && (
                        <button
                            onClick={async () => {
                                const newStatus = selectedCompany.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                await handleStatusChange(selectedCompany.id, newStatus);
                                setSelectedCompany(prev => ({ ...prev, status: newStatus }));
                            }}
                            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${selectedCompany.status === 'ACTIVE'
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                        >
                            {selectedCompany.status === 'ACTIVE' ? 'Suspend Company' : 'Activate Company'}
                        </button>
                    )
                }
            >
                {/* Drawer Body (Children) */}
                {selectedCompany && (
                    <>
                        {/* Company Basic Info */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Company Info
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="font-medium text-gray-800">{selectedCompany.phone || '—'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500">Total Events</span>
                                    <span className="font-medium text-gray-800">{selectedCompany.totalEvents ?? 0}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-500">Status</span>
                                    <span
                                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${selectedCompany.status === 'ACTIVE'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}
                                    >
                                        {selectedCompany.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Linked Organizers List */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                                Organizers ({selectedCompany.organizers?.length || 0})
                            </h3>
                            {(!selectedCompany.organizers || selectedCompany.organizers.length === 0) ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                    No organizers linked to this company.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedCompany.organizers.map((org) => (
                                        <div
                                            key={org.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{org.name}</p>
                                                <p className="text-xs text-gray-500">{org.email}</p>
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${org.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {org.status}
                                            </span>
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

export default CompaniesPage;
