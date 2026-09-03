// frontend/src/components/landing/Navbar.jsx
//
// RESPONSIBILITY: Top navigation bar for the public landing page.
// Transparent on hero, solid clean white on scroll.
// Conditional Links: User Profile & Logout (if logged in) OR Sign In & Get Started (if logged out)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';

const NAV_LINKS = [
    { label: 'Home', href: '#home' },
    { label: 'Events', href: '#events' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact', href: '#contact' },
];

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Scroll helper
    const scrollToSection = (href) => {
        if (href === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const el = document.querySelector(href);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    // Agar doosre page (AllEventsPage/EventDetail) se navigate ho kar aaye hain to target section par scroll karein
    useEffect(() => {
        if (location.pathname === '/' && location.state?.scrollTo) {
            const target = location.state.scrollTo;
            window.history.replaceState({}, document.title);
            setTimeout(() => scrollToSection(target), 100);
        }
    }, [location]);

    const handleNavClick = (href) => {
        setMenuOpen(false);

        if (location.pathname === '/') {
            scrollToSection(href);
        } else {
            // Doosre page se pehle '/' par jayein aur target section sath pass karein
            navigate('/', { state: { scrollTo: href } });
        }
    };


    const handleLogout = () => {
        if (logout) logout();
        navigate('/login');
    };

    const navText = scrolled ? 'text-gray-700 hover:text-indigo-600' : 'text-white/90 hover:text-white';
    const navHover = scrolled ? 'hover:bg-gray-50' : 'hover:bg-white/10';
    const headerBg = scrolled
        ? 'bg-white shadow-sm border-b border-gray-100'
        : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent';

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[72px]">

                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Calendar size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                            Eventify
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <ul className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <li key={link.label}>
                                <button
                                    onClick={() => handleNavClick(link.href)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${navText} ${navHover}`}
                                >
                                    {link.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Desktop CTA Area */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${scrolled ? 'border-gray-200 text-gray-700' : 'border-white/20 text-white'
                                    }`}>
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <User size={14} />
                                    </div>
                                    <span className="text-sm font-medium mr-1">
                                        {user?.name || user?.firstName || 'User'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white/90 hover:text-white'
                                        }`}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label="Toggle menu"
                        className={`md:hidden p-2 rounded-lg transition-colors ${navText} ${navHover}`}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 shadow-xl px-4 py-4 space-y-2">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavClick(link.href)}
                            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            {link.label}
                        </button>
                    ))}

                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <>
                                <div className="px-4 py-3 flex items-center gap-3 bg-gray-50 rounded-lg mb-1">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <User size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {user?.name || user?.firstName || 'User'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg text-center transition-colors shadow-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
