// frontend/src/pages/OrganizerCompanyPage.jsx
//
// RESPONSIBILITY: Organizer ki company profile aur team members manage karne ka page.
// YEH PAGE PEHLE OrganizerDashboardPage.jsx mein tha — hum ne use
// separate file mein nikaala. Kyun? Single Responsibility Principle (SRP):
//   - OrganizerDashboardPage → Analytics overview (stats, charts, table)
//   - OrganizerCompanyPage   → Company profile management (edit, team)
// Dono ko alag rakhne se dono ko independently modify karna aasaan hai.

import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/dashboard/Sidebar';

// ─────────────────────────────────────────────────────────────────
// REUSABLE SUB-COMPONENT: InfoRow
//
// Kyun alag component?
// Company profile mein 5+ label-value rows hain. Agar har row ke
// liye alag div likhen to code repeat hoga (DRY violation).
// Ek component banao, props se data pass karo — DRY!
// ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-500 font-medium min-w-[120px]">{label}</span>
        <span className="text-sm text-gray-800 text-right">{value || '—'}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────────
// REUSABLE SUB-COMPONENT: StatusBadge
//
// Kyun alag component?
// Status badge (ACTIVE/SUSPENDED) company aur team members dono
// mein use hota hai. DRY: ek component, baar baar use karo.
// ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${
        status === 'ACTIVE'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-orange-100 text-orange-700'
    }`}>
        {status}
    </span>
);


const OrganizerCompanyPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ── State ─────────────────────────────────────────────────────
    const [company, setCompany] = useState(null);       // Company ka data (DB se)
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);  // View mode ya Edit mode?
    const [saving, setSaving] = useState(false);         // Save button disabled rakhne ke liye
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    // Edit form ka local state — company data load hone par initialize hoga
    // Kyun alag state? — Agar user "Cancel" kare to original data restore ho sake
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        tagline: '',
        logo: '',
        banner: ''
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Data Fetch on Mount ───────────────────────────────────────
    // useEffect([]) — sirf ek baar, component load hone par
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                'http://localhost:5000/api/organizer/my-company',
                { withCredentials: true }
            );
            if (res.data.success) {
                setCompany(res.data.data);
                // Form ko DB se aaye data se pre-fill karo
                setFormData({
                    name: res.data.data.name || '',
                    description: res.data.data.description || '',
                    email: res.data.data.email || '',
                    phone: res.data.data.phone || '',
                    address: res.data.data.address || '',
                    website: res.data.data.website || '',
                    tagline: res.data.data.tagline || '',
                    logo: res.data.data.logo || '',
                    banner: res.data.data.banner || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch company data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Single Input Handler (DRY) ────────────────────────────────
    // [e.target.name] = computed property key — ek function se sab fields handle
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveError('');
        setSaveSuccess('');
    };

    // ── Save Handler ──────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setSaveError('');
        setSaveSuccess('');
        try {
            const res = await axios.put(
                'http://localhost:5000/api/organizer/my-company',
                formData,
                { withCredentials: true }
            );
            if (res.data.success) {
                // Spread operator: purana company data rakh, sirf changed fields update karo
                setCompany(prev => ({ ...prev, ...res.data.data }));
                setSaveSuccess('Company updated successfully!');
                setIsEditing(false);
            }
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Cancel Handler ────────────────────────────────────────────
    // Form data ko original company data se reset karo
    const handleCancel = () => {
        setFormData({
            name: company?.name || '',
            description: company?.description || '',
            email: company?.email || '',
            phone: company?.phone || '',
            address: company?.address || '',
            website: company?.website || '',
            tagline: company?.tagline || '',
            logo: company?.logo || '',
            banner: company?.banner || ''
        });
        setIsEditing(false);
        setSaveError('');
        setSaveSuccess('');
    };

    // ── Reusable Form Field (DRY) ─────────────────────────────────
    // Edit form mein fields hain — same layout, sirf label/name/type alag.
    // Ek component se sab handle karo. isTextarea prop se textarea ya input choose karo.
    const FormField = ({ label, name, type = 'text', isTextarea = false, placeholder = '' }) => (
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                {label}
            </label>
            {isTextarea ? (
                <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                />
            )}
        </div>
    );


    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">My Company</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Manage your company profile and team members.
                    </p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-sm text-gray-500">Loading company data...</p>
                    </div>
                ) : (
                    <div className="max-w-5xl space-y-6">

                        {/* ── Company Profile Card ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Company Profile</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Your registered company information</p>
                                </div>
                                {/* Edit / Save / Cancel — conditional rendering */}
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-medium px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="text-xs font-medium px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="text-xs font-medium px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition disabled:opacity-60"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Feedback Messages */}
                            {saveSuccess && (
                                <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
                                    ✓ {saveSuccess}
                                </div>
                            )}
                            {saveError && (
                                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                                    ✗ {saveError}
                                </div>
                            )}

                            {/* View Mode */}
                            {!isEditing && company && (
                                <div className="space-y-1">
                                    <InfoRow label="Company Name" value={company.name} />
                                    <InfoRow label="Tagline" value={company.tagline} />
                                    <InfoRow label="Description" value={company.description} />
                                    <InfoRow label="Email" value={company.email} />
                                    <InfoRow label="Phone" value={company.phone} />
                                    <InfoRow label="Address" value={company.address} />
                                    <div className="flex justify-between items-start py-2.5 border-b border-gray-50">
                                        <span className="text-sm text-gray-500 font-medium min-w-[120px]">Website</span>
                                        <span className="text-sm text-gray-800 text-right">
                                            {company.website ? (
                                                <a
                                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {company.website}
                                                </a>
                                            ) : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                                        <span className="text-sm text-gray-500 font-medium">Logo</span>
                                        {company.logo ? (
                                            <img src={company.logo} alt="Company Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                                        <span className="text-sm text-gray-500 font-medium">Banner</span>
                                        {company.banner ? (
                                            <img src={company.banner} alt="Company Banner" className="w-24 h-10 rounded-lg object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center py-2.5">
                                        <span className="text-sm text-gray-500 font-medium">Status</span>
                                        <StatusBadge status={company.status} />
                                    </div>
                                </div>
                            )}

                            {/* Edit Mode */}
                            {isEditing && (
                                <div className="space-y-4">
                                    <FormField label="Company Name" name="name" />
                                    <FormField label="Tagline" name="tagline" placeholder="e.g. Creating unforgettable live experiences" />
                                    <FormField label="Website" name="website" type="url" placeholder="https://yourcompany.com" />
                                    <FormField label="Description" name="description" isTextarea={true} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField label="Email" name="email" type="email" />
                                        <FormField label="Phone" name="phone" type="tel" />
                                    </div>
                                    <FormField label="Address" name="address" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField label="Logo Image URL" name="logo" placeholder="https://images.unsplash.com/..." />
                                        <FormField label="Banner Image URL" name="banner" placeholder="https://images.unsplash.com/..." />
                                    </div>
                                    {/* Status — read only, sirf PM change karta hai */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                            Status (Read-only)
                                        </label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <StatusBadge status={company?.status} />
                                            <span className="text-xs text-gray-400 ml-2">
                                                Managed by Product Manager
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Team Members Card ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-900 mb-4">
                                Team Members ({company?.organizers?.length || 0})
                            </h2>
                            {(!company?.organizers || company.organizers.length === 0) ? (
                                <p className="text-sm text-gray-400 italic text-center py-4">
                                    No team members found.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {company.organizers.map(org => (
                                        <div
                                            key={org.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {org.name}
                                                    {/* "You" badge — logged-in organizer ko highlight karo */}
                                                    {org.id === user?.id && (
                                                        <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                                            You
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">{org.email}</p>
                                            </div>
                                            <StatusBadge status={org.status} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

export default OrganizerCompanyPage;
