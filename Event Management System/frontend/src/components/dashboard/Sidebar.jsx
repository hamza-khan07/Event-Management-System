import React from 'react';

const Sidebar = ({ user, handleLogout }) => {
    return (
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
    );
};

export default Sidebar;
