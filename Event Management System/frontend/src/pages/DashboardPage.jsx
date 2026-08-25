import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ArrowDown } from 'lucide-react';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // API se aane wale numbers is state me save honge
    const [stats, setStats] = useState({
        totalCompanies: 0,
        totalOrganizers: 0,
        totalParticipants: 0,
        totalEvents: 0
    });

    const [loadingStats, setLoadingStats] = useState(false);

    // Floating button ki visibility control karne ke liye
    const [showScrollButton, setShowScrollButton] = useState(true);
    useEffect(() => {
        // Table ko uske ID se find kar rahe hain
        const tableElement = document.getElementById('top-organizers-section');
        if (!tableElement) return;
        // IntersectionObserver check karega k table user ki screen (viewport) mein aai hai ya nahi
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Agar table screen par aa gayi hai (isIntersecting), to button hide (false) kar do.
                // Agar nahi aayi, to button show (true) kar do.
                setShowScrollButton(!entry.isIntersecting);
            },
            {
                root: null, // Viewport (puri screen) ko root maan rahay hain
                threshold: 0.1 // Jaise hi table 10% bhi nazar aaye, button hide kardo
            }
        );
        observer.observe(tableElement);
        return () => {
            if (tableElement) observer.unobserve(tableElement);
        };
    }, [user]); // user dependency isiliye takay agar PM data baad me load ho to observer theek se lag jaye
    // Click par smoothly scroll karwane ka function
    const scrollToOrganizers = () => {
        document.getElementById('top-organizers-section')?.scrollIntoView({ behavior: 'smooth' });
    };


    // Jab page load ho, toh backend ko call lagao (sirf PM ke liye)
    useEffect(() => {
        if (user?.role === 'PRODUCT_MANAGER') {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            // Humne `fetch` hata kar `axios.get` laga diya
            const response = await axios.get('http://localhost:5000/api/dashboard/pm-stats', {
                withCredentials: true // Cookie (token) backend ko bhejne k liye zaroori hai
            });

            // Note: Axios automatically data ko JSON mein badal deta hai.
            // Is liye humein `await response.json()` likhne ki zaroorat nahi pari.
            // Hum direct response.data check kar saktay hain.
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
        setLoadingStats(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    // 2. Apne component function se bahar (ya andar top par) yeh DUMMY DATA rakh dein
    const growthData = [
        { name: 'Jan', users: 120, events: 10 },
        { name: 'Feb', users: 200, events: 25 },
        { name: 'Mar', users: 150, events: 15 },
        { name: 'Apr', users: 300, events: 40 },
        { name: 'May', users: 450, events: 60 },
        { name: 'Jun', users: 600, events: 85 },
    ];
    const distributionData = [
        { name: 'Tech Conferences', value: 40, color: '#3b82f6' }, // Blue
        { name: 'Webinars', value: 35, color: '#8b5cf6' },       // Purple
        { name: 'Sports', value: 25, color: '#10b981' },         // Emerald
    ];
    const topOrganizers = [
        { id: 1, name: 'Tech Innovations', company: 'Google', events: 15, status: 'Active' },
        { id: 2, name: 'Startup Hub', company: 'Y Combinator', events: 12, status: 'Active' },
        { id: 3, name: 'Esports Arena', company: 'Riot Games', events: 8, status: 'Pending' },
    ];

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            {/* ==================================================== */}
            {/* 1. SIDEBAR (Navigation Area)                         */}
            {/* ==================================================== */}
            <aside className="w-56 bg-gray-950 text-white h-full p-4 flex flex-col">
                <div className="mb-6 flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-blue-600 font-bold flex items-center justify-center text-xs">
                        EMS
                    </div>
                    <h2 className="text-lg font-bold tracking-wider">Dashboard</h2>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 flex flex-col gap-1">
                    <a href="#" className="py-2 px-3 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium transition">
                        Overview
                    </a>


                    {/* PM ko kuch extra menus dikhane hain jo baad mein kaam ayenge */}
                    {user?.role === 'PRODUCT_MANAGER' && (
                        <>
                            <a href="#" className="py-2 px-3 hover:bg-slate-800 rounded-lg text-slate-300 text-sm font-medium transition">
                                Companies
                            </a>
                            <a href="#" className="py-2 px-3 hover:bg-slate-800 rounded-lg text-slate-300 text-sm font-medium transition">
                                Organizers
                            </a>
                        </>
                    )}
                </nav>

                {/* Profile & Logout Section at bottom */}
                <div className="mt-auto border-t border-slate-800 pt-4">
                    <div className="mb-3">
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-[11px] text-slate-400">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-1.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition text-xs"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ==================================================== */}
            {/* 2. MAIN CONTENT AREA (Stats Cards)                   */}
            {/* ==================================================== */}
            <main className="flex-1 p-4 overflow-y-auto">
                <header className="mb-4">
                    <h1 className="text-lg font-bold text-gray-900">
                        Welcome back, {user?.name}!
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Here is the platform overview for today.
                    </p>
                </header>

                {/* Sirf PM ko Stats dikhane hain */}
                {user?.role === 'PRODUCT_MANAGER' && (
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-2">Platform Statistics</h2>

                        {loadingStats ? (
                            <p className="text-sm text-gray-500">Loading numbers from database...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: Total Companies */}
                                <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Companies</p>
                                    <p className="text-xl font-bold text-blue-600 mt-1">{stats.totalCompanies}</p>
                                </div>

                                {/* Card 2: Total Organizers */}
                                <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Organizers</p>
                                    <p className="text-xl font-bold text-purple-600 mt-1">{stats.totalOrganizers}</p>
                                </div>

                                {/* Card 3: Total Participants */}
                                <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Participants</p>
                                    <p className="text-xl font-bold text-emerald-600 mt-1">{stats.totalParticipants}</p>
                                </div>

                                {/* Card 4: Total Events */}
                                <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Events</p>
                                    <p className="text-xl font-bold text-orange-600 mt-1">{stats.totalEvents}</p>
                                </div>
                            </div>
                        )}


                        {/* MIDDLE ROW: CHARTS AREA (60% / 40%)                  */}
                        {/* ==================================================== */}
                        <div className="flex flex-col lg:flex-row gap-4 mt-6">

                            {/* Left Side: Growth Line Chart (60%) */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:w-[60%] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Platform Growth</h3>
                                        <p className="text-[11px] text-gray-500">Users vs Events (Last 6 months)</p>
                                    </div>
                                    <TrendingUp size={16} className="text-blue-500" />
                                </div>
                                <div className="flex-1 min-h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="events" name="Events" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            {/* Right Side: Distribution Doughnut Chart (40%) */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:w-[40%] flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 mb-1">Event Distribution</h3>
                                <p className="text-[11px] text-gray-500 mb-4">By category</p>

                                <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={distributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                {distributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Custom Legend */}
                                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                                        {distributionData.map((item, index) => (
                                            <div key={index} className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[11px] text-gray-600 font-medium">{item.name} ({item.value}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ==================================================== */}
                        {/* BOTTOM ROW: TOP ORGANIZERS TABLE                     */}
                        {/* ==================================================== */}
                        <div id="top-organizers-section" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-800">Top Organizers</h3>
                                <button className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                                            <th className="pb-3 font-semibold">Organizer Name</th>
                                            <th className="pb-3 font-semibold">Company</th>
                                            <th className="pb-3 font-semibold">Total Events</th>
                                            <th className="pb-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topOrganizers.map((org) => (
                                            <tr key={org.id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition cursor-pointer">
                                                <td className="py-3 text-sm font-medium text-gray-900">{org.name}</td>
                                                <td className="py-3 text-sm text-gray-600">{org.company}</td>
                                                <td className="py-3 text-sm text-gray-600 font-medium">{org.events}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${org.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {org.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
                {/* Floating Scroll Pill Button */}
                {user?.role === 'PRODUCT_MANAGER' && showScrollButton && (
                    <button
                        onClick={scrollToOrganizers}
                        className="fixed bottom-0.5 left-3/5 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-full shadow-lg text-[10px] font-medium flex items-center gap-1 backdrop-blur-md transition-all z-30 animate-bounce"
                    >
                        Top Organizers
                        <ArrowDown size={14} />
                    </button>
                )}



                {/* Agar user PM nahi hai (Organizer / Participant) */}
                {user?.role !== 'PRODUCT_MANAGER' && (
                    <div className="bg-white p-8 rounded-xl border border-blue-100 shadow-sm text-center bg-blue-50">
                        <p className="text-blue-800 font-medium">
                            Your specific dashboard features will be implemented soon!
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default DashboardPage;
