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
    // Create Company Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        description: '',
        address: '',
        website: '',
        tagline: '',
        logo: '',
        banner: ''
    });
    const [creating, setCreating] = useState(false);

    // Edit Company states — drawer ke andar inline edit ke liye
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [updating, setUpdating] = useState(false);

    // Add Organizer states — company drawer mein organizer add karne ke liye
    const [showAddOrganizer, setShowAddOrganizer] = useState(false);
    const [orgForm, setOrgForm] = useState({ name: '', email: '', password: '' });
    const [addingOrg, setAddingOrg] = useState(false);
    const [orgError, setOrgError] = useState('');   // inline error message ke liye


    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleCreate = async (e) => {
        e.preventDefault(); // page reload rokna
        setCreating(true);
        try {
            await axios.post('http://localhost:5000/api/companies', formData, { withCredentials: true });

            // Success ke baad:
            setShowCreateModal(false);                   // modal band karo
            setFormData({
                name: '',
                email: '',
                phone: '',
                description: '',
                address: '',
                website: '',
                tagline: '',
                logo: '',
                banner: ''
            }); // form reset
            fetchCompanies(search, 1, limit);            // list refresh karo — page 1 pe wapis
        } catch (err) {
            console.error('Failed to create company:', err);
            alert('Error creating company!');
        } finally {
            setCreating(false);
        }
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

    // Drawer band karo — edit mode + organizer form bhi reset karo
    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedCompany(null);
        setEditMode(false);   // drawer band hone par edit mode reset
        setEditData({});
        setShowAddOrganizer(false);   // organizer form bhi reset
        setOrgForm({ name: '', email: '', password: '' });
        setOrgError('');
    };

    // Add Organizer submit handler — POST /api/companies/:id/organizers
    const handleAddOrganizer = async (e) => {
        e.preventDefault();
        setOrgError('');      // pehle purana error clear karo
        setAddingOrg(true);
        try {
            const res = await axios.post(
                `http://localhost:5000/api/companies/${selectedCompany.id}/organizers`,
                orgForm,
                { withCredentials: true }
            );
            // Nayi organizer ko local state mein add karo — page reload nahi
            const newOrg = res.data.data;
            setSelectedCompany(prev => ({
                ...prev,
                organizers: [...(prev.organizers || []), newOrg]
            }));
            // Form reset aur modal band karo
            setOrgForm({ name: '', email: '', password: '' });
            setShowAddOrganizer(false);
        } catch (err) {
            // Server se message lo, nahi to generic error
            const msg = err.response?.data?.message || 'Organizer add karne mein error aaya';
            setOrgError(msg);   // alert ki jagah inline error — better UX
        } finally {
            setAddingOrg(false);
        }
    };

    // Edit Info submit handler — PUT /api/companies/:id
    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await axios.put(
                `http://localhost:5000/api/companies/${selectedCompany.id}`,
                editData,
                { withCredentials: true }
            );
            // Local state update karo — page reload na hona pade
            const updated = { ...selectedCompany, ...editData };
            setSelectedCompany(updated);
            setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, ...editData } : c));
            setEditMode(false); // edit mode band karo
        } catch (err) {
            console.error('Failed to update company:', err);
            alert('Company update karne mein error aaya!');
        } finally {
            setUpdating(false);
        }
    };



    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            {/* Reusable Sidebar — Same component jo Dashboard par use kiya */}
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Companies</h1>
                        <p className="text-xs text-gray-500 mt-1">Manage all registered companies on the platform.</p>
                    </div>
                    {/* Create Company Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                        + Create Company
                    </button>
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
                        {/* ── Company Info Section ── */}
                        <div>
                            {/* Section header: title + Edit / Cancel button */}
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                                    Company Info
                                </h3>
                                {!editMode ? (
                                    // "Edit Info" button — click karo to edit mode on ho
                                    <button
                                        onClick={() => {
                                            setEditMode(true);
                                            // Current values pre-fill karo form mein
                                            setEditData({
                                                name: selectedCompany.name || '',
                                                email: selectedCompany.email || '',
                                                phone: selectedCompany.phone || '',
                                                description: selectedCompany.description || '',
                                                address: selectedCompany.address || '',
                                            });
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                                    >
                                        ✏ Edit Info
                                    </button>
                                ) : (
                                    // "Cancel" button — edit mode off karo
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="text-xs text-gray-400 hover:text-gray-600 font-medium transition"
                                    >
                                        ✕ Cancel
                                    </button>
                                )}
                            </div>

                            {editMode ? (
                                // ── EDIT FORM (inline in drawer) ──
                                <form onSubmit={handleUpdate} className="space-y-3">
                                    {[  // DRY: array se fields render karo — ek jagah list, ek jagah JSX
                                        { label: 'Company Name *', key: 'name', type: 'text', required: true },
                                        { label: 'Tagline', key: 'tagline', type: 'text', required: false },
                                        { label: 'Website', key: 'website', type: 'url', required: false },
                                        { label: 'Email', key: 'email', type: 'email', required: false },
                                        { label: 'Phone', key: 'phone', type: 'text', required: false },
                                        { label: 'Address', key: 'address', type: 'text', required: false },
                                        { label: 'Logo Image URL', key: 'logo', type: 'url', required: false },
                                        { label: 'Banner Image URL', key: 'banner', type: 'url', required: false },
                                    ].map(({ label, key, type, required }) => (
                                        <div key={key}>
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5 block">{label}</label>
                                            <input
                                                type={type}
                                                required={required}
                                                value={editData[key] || ''}
                                                onChange={(e) => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                    {/* Description is textarea — alag render karo */}
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5 block">Description</label>
                                        <textarea
                                            rows={3}
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            ) : (
                                // ── VIEW MODE (read-only rows) ──
                                <div className="space-y-2 text-sm">
                                    <div className="py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500 block mb-1">Tagline</span>
                                        <p className="text-gray-800 font-medium text-xs leading-relaxed">
                                            {selectedCompany.tagline || '—'}
                                        </p>
                                    </div>
                                    <div className="py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500 block mb-1">Description</span>
                                        <p className="text-gray-800 font-medium text-xs leading-relaxed">
                                            {selectedCompany.description || '—'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Website</span>
                                        <span className="font-medium text-gray-800">
                                            {selectedCompany.website ? (
                                                <a
                                                    href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {selectedCompany.website}
                                                </a>
                                            ) : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Phone</span>
                                        <span className="font-medium text-gray-800">{selectedCompany.phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Address</span>
                                        <span className="font-medium text-gray-800 text-right max-w-[60%]">{selectedCompany.address || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Logo</span>
                                        {selectedCompany.logo ? (
                                            <img src={selectedCompany.logo} alt="Logo" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Banner</span>
                                        {selectedCompany.banner ? (
                                            <img src={selectedCompany.banner} alt="Banner" className="w-16 h-8 rounded object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                                        <span className="text-gray-500">Total Events</span>
                                        <span className="font-medium text-gray-800">{selectedCompany.totalEvents ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${selectedCompany.status === 'ACTIVE'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {selectedCompany.status}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Organizers Section ── */}
                        <div>
                            {/* Section header: count + Add button */}
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                                    Organizers ({selectedCompany.organizers?.length || 0})
                                </h3>
                                {/* Show Add button sirf tab jab form open na ho */}
                                {!showAddOrganizer && (
                                    <button
                                        onClick={() => {
                                            setShowAddOrganizer(true);
                                            setOrgError('');
                                            setOrgForm({ name: '', email: '', password: '' });
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                                    >
                                        + Add Organizer
                                    </button>
                                )}
                            </div>

                            {/* Inline Add Organizer Form — show hoga jab showAddOrganizer true ho */}
                            {showAddOrganizer && (
                                <form onSubmit={handleAddOrganizer} className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                                    <p className="text-xs font-semibold text-blue-700 mb-2">New Organizer Details</p>

                                    {/* Inline error message — alert() ki jagah yahan dikhao */}
                                    {orgError && (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                                            {orgError}
                                        </p>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5 block">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={orgForm.name}
                                            onChange={(e) => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Organizer ka naam"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5 block">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={orgForm.email}
                                            onChange={(e) => setOrgForm(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="organizer@email.com"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5 block">Temp Password *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={orgForm.password}
                                            onChange={(e) => setOrgForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Min 6 characters"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddOrganizer(false); setOrgError(''); }}
                                            className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={addingOrg}
                                            className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                        >
                                            {addingOrg ? 'Adding...' : 'Add Organizer'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Organizers List */}
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
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${org.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                }`}>
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
            {/* Create Company Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-2 border-b border-gray-100 z-10">
                            <h2 className="text-lg font-bold text-gray-900">Create New Company</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreate} className="space-y-4">

                            {/* Name — Required */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. TechCorp Ltd."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Tagline */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tagline</label>
                                <input
                                    type="text"
                                    value={formData.tagline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                                    placeholder="e.g. Creating unforgettable live experiences"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Website</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    placeholder="https://yourcompany.com"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="company@email.com"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+92 300 1234567"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Short description about the company..."
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter Company Address"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Logo & Banner URLs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Logo Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.logo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Banner Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.banner}
                                        onChange={(e) => setFormData(prev => ({ ...prev, banner: e.target.value }))}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    {creating ? 'Creating...' : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>

    );
};

export default CompaniesPage;
