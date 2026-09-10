import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, handleLogout }) => {
    const location = useLocation();

    // linkClass: for exact route matching
    const linkClass = (path) =>
        `py-2 px-3 rounded-lg text-sm font-medium transition ${
            location.pathname === path
                ? 'bg-blue-600/20 text-blue-400'
                : 'hover:bg-slate-800 text-slate-300'
        }`;

    // prefixLinkClass: for matching route prefixes
    // Keeps navigation active when nested pages are active (e.g. /organizer/events/create)
    const prefixLinkClass = (prefix) =>
        `py-2 px-3 rounded-lg text-sm font-medium transition ${
            location.pathname.startsWith(prefix)
                ? 'bg-blue-600/20 text-blue-400'
                : 'hover:bg-slate-800 text-slate-300'
        }`;

    return (
        <aside className="w-56 bg-gray-950 text-white h-full p-4 flex flex-col">
            <div className="mb-6 flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-blue-600 font-bold flex items-center justify-center text-xs">
                    EMS
                </div>
                <h2 className="text-lg font-bold tracking-wider">Dashboard</h2>
            </div>

            {/* ── PM-only Navigation ── */}
            {user?.role === 'PRODUCT_MANAGER' && (
                <>
                    <Link to="/dashboard" className={linkClass('/dashboard')}>
                        Overview
                    </Link>
                    <Link to="/companies" className={linkClass('/companies')}>
                        Companies
                    </Link>
                    <Link to="/organizers" className={linkClass('/organizers')}>
                        Organizers
                    </Link>
                    <Link to="/participants" className={linkClass('/participants')}>
                        Participants
                    </Link>
                </>
            )}

            {/* ── Organizer-only Navigation ── */}
            {user?.role === 'ORGANIZER' && (
                <>
                    <Link to="/organizer/dashboard" className={linkClass('/organizer/dashboard')}>
                        Overview
                    </Link>
                    <Link to="/organizer/company" className={linkClass('/organizer/company')}>
                        My Company
                    </Link>
                    {/* Active for nested event routes as well */}
                    <Link to="/organizer/events" className={prefixLinkClass('/organizer/events')}>
                        My Events
                    </Link>
                    <Link to="/organizer/participants" className={linkClass('/organizer/participants')}>
                        My Participants
                    </Link>
                </>
            )}
            
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
    );
};

export default Sidebar;
