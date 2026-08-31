// frontend/src/pages/OrganizerDashboardPage.jsx
//
// RESPONSIBILITY: Organizer ka "Overview" analytics dashboard.
// Yeh page login ke baad pehla page hai — organizer ko ek nazar mein
// apni company ki health dikhayi jaati hai.
//
// Architecture:
//   - 4 StatCards  → Summary numbers (totalEvents, registrations, etc.)
//   - LineChart    → Last 6 months registration trend
//   - PieChart     → Events by status (DRAFT/PUBLISHED/CANCELLED)
//   - Table        → Last 5 events with fill rate progress bar
//
// Charts library: recharts (PM dashboard mein bhi yahi use ho rahi hai — consistency!)
// DRY: StatusBadge, StatCard sab reusable components hain.

import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Calendar, Users, Layers, BarChart2 } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import Sidebar from '../components/dashboard/Sidebar';

// ─────────────────────────────────────────────────────────────────
// REUSABLE: StatusBadge
// Kyun: Status display multiple jagah chahiye (table mein bhi).
// DRY: Ek component, props se value lo.
//
// Yeh component sirf EVENT status ke liye hai — 3 possible values:
//   DRAFT       → gray
//   PUBLISHED   → blue/green
//   CANCELLED   → red
// ─────────────────────────────────────────────────────────────────
const EventStatusBadge = ({ status }) => {
    // Object lookup — agar baar baar if/else likhein to code messy hota
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
// REUSABLE: FillRateBar
// Kyun: Fill rate (capacity utilization) ek visual progress bar se
// zyada clearly samajh aati hai numbers ki bajaye.
// Yeh DRY component table ke har row mein use hoga.
//
// Color logic:
//   < 40%  → red (kam registrations)
//   < 75%  → yellow (theek theek)
//   >= 75% → green (achi registrations)
// ─────────────────────────────────────────────────────────────────
const FillRateBar = ({ rate }) => {
    const pct = Math.min(rate || 0, 100);  // 100 se zyada na ho
    const color = pct >= 75 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2">
            {/* Progress bar container */}
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs text-gray-600 font-medium">{pct}%</span>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
// PIE CHART COLOR MAP
// Constant object isliye ke baar baar inline likhne se DRY violation hota.
// Future mein status add ho to sirf yahan ek line add karo.
// ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    PUBLISHED: '#10b981',  // Emerald (healthy)
    DRAFT: '#94a3b8',  // Slate gray (neutral)
    CANCELLED: '#ef4444',  // Red (warning)
};


// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const OrganizerDashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ── State ─────────────────────────────────────────────────────
    const [overviewData, setOverviewData] = useState(null);  // Full API response
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Data Fetch ────────────────────────────────────────────────
    // useEffect([]) — sirf component mount par ek baar
    useEffect(() => {
        fetchOverviewStats();
    }, []);

    const fetchOverviewStats = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(
                'http://localhost:5000/api/organizer/overview-stats',
                { withCredentials: true }  // JWT cookie bhejne ke liye
            );
            if (res.data.success) {
                setOverviewData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch overview stats:', err);
            setError('Could not load dashboard data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    // ── Destructure for clean JSX ─────────────────────────────────
    // Agar overviewData null hai to default empty values use karo
    // taake JSX mein baar baar ?. optional chaining na likhni pare
    const {
        summary = { totalEvents: 0, activeRegistrations: 0, totalCapacity: 0, upcomingEvents: 0 },
        registrationTrend = [],
        eventsByStatus = [],
        recentEvents = []
    } = overviewData || {};

    // ── Pie chart data prep ───────────────────────────────────────
    // Backend se [{status: 'PUBLISHED', count: 3}] aata hai.
    // Recharts ko {name, value, color} chahiye — map karo.
    const pieData = eventsByStatus.map(item => ({
        name: item.status,
        value: Number(item.count),
        color: STATUS_COLORS[item.status] || '#94a3b8'
    }));


    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={handleLogout} />

            <main className="flex-1 p-4 overflow-y-auto">
                {/* ── Page Header ── */}
                <header className="mb-4">
                    <h1 className="text-lg font-bold text-gray-900">
                        Welcome back, {user?.name}!
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Here is your company's performance overview.
                    </p>
                </header>

                {/* ── Error State ── */}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* ── Loading State ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-sm text-gray-500">Loading your dashboard...</p>
                    </div>
                ) : (
                    <div>

                        {/* ════════════════════════════════════════════════════
                            ROW 1: STAT CARDS
                            PM dashboard jaisa — 4 cards, grid layout.
                            StatCard component reuse kar rahe hain (DRY!).
                        ════════════════════════════════════════════════════ */}
                        <h2 className="text-base font-semibold text-gray-800 mb-2">Company Statistics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* StatCard: reusable component — sirf title, count, colorClass pass karo */}
                            <StatCard
                                title="Total Events"
                                count={summary.totalEvents}
                                colorClass="text-blue-600"
                            />
                            <StatCard
                                title="Active Registrations"
                                count={summary.activeRegistrations}
                                colorClass="text-emerald-600"
                            />
                            <StatCard
                                title="Total Capacity"
                                count={summary.totalCapacity}
                                colorClass="text-purple-600"
                            />
                            <StatCard
                                title="Upcoming Events"
                                count={summary.upcomingEvents}
                                colorClass="text-orange-600"
                            />
                        </div>

                        {/* ════════════════════════════════════════════════════
                            ROW 2: CHARTS (60/40 split — PM jaisa layout)
                        ════════════════════════════════════════════════════ */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6">

                            {/* ── LEFT: Registration Trend Line Chart (60%) ── */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:w-[60%] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Registration Trend</h3>
                                        <p className="text-[11px] text-gray-500">Monthly registrations (last 6 months)</p>
                                    </div>
                                    <TrendingUp size={16} className="text-blue-500" />
                                </div>

                                {/* Agar koi trend data nahi to placeholder dikhao */}
                                {registrationTrend.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                        <p className="text-sm text-gray-400 italic">No registration data yet.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-[220px]">
                                        {/* ResponsiveContainer: chart parent ki width/height le leta hai automatically */}
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={registrationTrend}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    allowDecimals={false}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="registrations"
                                                    name="Registrations"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 2 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* ── RIGHT: Events by Status Donut Chart (40%) ── */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:w-[40%] flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-800">Events by Status</h3>
                                    <p className="text-[11px] text-gray-500">Distribution of your events</p>
                                </div>

                                {pieData.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                        <p className="text-sm text-gray-400 italic">No events created yet.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                {/* innerRadius > 0 = Donut chart — modern feel */}
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Custom Legend — recharts ka default legend ugly hota hai */}
                                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                                            {pieData.map((item, index) => (
                                                <div key={index} className="flex items-center gap-1.5">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-[11px] text-gray-600 font-medium">
                                                        {item.name} ({item.value})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ════════════════════════════════════════════════════
                            ROW 3: RECENT EVENTS TABLE
                            PM ke "Top Organizers" table jaisi feel.
                            Fill Rate column: visual progress bar — zyada readable.
                        ════════════════════════════════════════════════════ */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-800">Recent Events</h3>
                                {/* "View All" button — baad mein /organizer/events pe link karega */}
                                <button className="text-xs text-blue-600 font-medium hover:underline">
                                    View All
                                </button>
                            </div>

                            {recentEvents.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-8">
                                    No events created yet. Create your first event!
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                                                <th className="pb-3 font-semibold">Event Name</th>
                                                <th className="pb-3 font-semibold">Date</th>
                                                {/* Registrations / Capacity: saath mein — zyada context milta hai */}
                                                <th className="pb-3 font-semibold">Registrations</th>
                                                <th className="pb-3 font-semibold">Fill Rate</th>
                                                <th className="pb-3 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentEvents.map((event) => (
                                                <tr
                                                    key={event.id}
                                                    className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    <td className="py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                                                        {event.title}
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-600">
                                                        {/* toLocaleDateString — human readable date */}
                                                        {new Date(event.event_date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-600">
                                                        {/* "5 / 50" format — registered / total capacity */}
                                                        <span className="font-medium text-gray-900">{event.registrations}</span>
                                                        <span className="text-gray-400"> / {event.capacity}</span>
                                                    </td>
                                                    <td className="py-3">
                                                        {/* FillRateBar: reusable progress bar component */}
                                                        <FillRateBar rate={event.fillRate} />
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <EventStatusBadge status={event.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

export default OrganizerDashboardPage;
