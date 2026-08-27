import React from 'react';
import { Link, useLocation } from 'react-router-dom';



const Sidebar = ({ user, handleLogout }) => {
    const location = useLocation();
    return (
        <aside className="w-56 bg-gray-950 text-white h-full p-4 flex flex-col">
            <div className="mb-6 flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-blue-600 font-bold flex items-center justify-center text-xs">
                    EMS
                </div>
                <h2 className="text-lg font-bold tracking-wider">Dashboard</h2>
            </div>



            <Link
                to="/dashboard"
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${location.pathname === '/dashboard'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-slate-800 text-slate-300'
                    }`}
            >
                Overview
            </Link>
            {user?.role === 'PRODUCT_MANAGER' && (
                <>
                    <Link
                        to="/companies"
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition ${location.pathname === '/companies'
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'hover:bg-slate-800 text-slate-300'
                            }`}
                    >
                        Companies
                    </Link>
                    <Link
                        to="#"
                        className="py-2 px-3 hover:bg-slate-800 rounded-lg text-slate-300 text-sm font-medium transition"
                    >
                        Organizers
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
