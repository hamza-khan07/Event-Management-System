// frontend/src/components/landing/Navbar.jsx
//
// RESPONSIBILITY: Top navigation bar for public pages.
// Transparent on Landing Page hero (hero image visible behind navbar).
// Smoothly transitions to modern dark glassmorphism (bg-slate-950/80 with backdrop-blur-md) on scroll.

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
    const [activeNav, setActiveNav] = useState('#home');

    const isLandingPage = location.pathname === '/';
    // Transparent only on the landing page when scrolled to the top and mobile menu is closed
    const isTransparent = isLandingPage && !scrolled && !menuOpen;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 25);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Active section spy for landing page
    useEffect(() => {
        if (location.pathname !== '/') {
            if (location.pathname.startsWith('/events')) {
                setActiveNav('#events');
            } else {
                setActiveNav('');
            }
            return;
        }

        const handleScrollSpy = () => {
            const sections = ['contact', 'how-it-works', 'events', 'home'];
            const scrollPosition = window.scrollY + 140;

            for (const section of sections) {
                const el = document.getElementById(section);
                if (el && el.offsetTop <= scrollPosition) {
                    setActiveNav(`#${section}`);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScrollSpy, { passive: true });
        handleScrollSpy();
        return () => window.removeEventListener('scroll', handleScrollSpy);
    }, [location.pathname]);

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

    // External page navigation support
    useEffect(() => {
        if (location.pathname === '/' && location.state?.scrollTo) {
            const target = location.state.scrollTo;
            window.history.replaceState({}, document.title);
            setTimeout(() => {
                scrollToSection(target);
                setActiveNav(target);
            }, 100);
        }
    }, [location]);

    const handleNavClick = (href) => {
        setMenuOpen(false);
        setActiveNav(href);

        if (location.pathname === '/') {
            scrollToSection(href);
        } else {
            navigate('/', { state: { scrollTo: href } });
        }
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/login');
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out ${isTransparent
                ? 'bg-transparent border-b border-transparent'
                : 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30'
                }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[72px]">

                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-9 h-9 bg-indigo-600 group-hover:bg-indigo-500 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                            <Calendar size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">
                            Eventify
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <ul className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => {
                            const isActive = activeNav === link.href;
                            return (
                                <li key={link.label}>
                                    <button
                                        onClick={() => handleNavClick(link.href)}
                                        className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isActive
                                            ? 'text-indigo-400 font-semibold'
                                            : isTransparent
                                                ? 'text-white/90 hover:text-white font-medium drop-shadow-sm'
                                                : 'text-slate-300 hover:text-white font-medium'
                                            }`}
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Desktop CTA / Profile Area */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* User Pill */}
                                <div
                                    className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-slate-200 transition-all cursor-default ${isTransparent
                                        ? 'border border-white/20 bg-black/25 backdrop-blur-sm text-white hover:bg-black/35'
                                        : 'border border-slate-700 hover:bg-slate-800 text-slate-200'
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <User size={13} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-sm font-medium">
                                        {user?.name || user?.firstName || 'User'}
                                    </span>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${isTransparent
                                        ? 'text-white/90 hover:text-white drop-shadow-sm'
                                        : 'text-slate-300 hover:text-white'
                                        }`}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-600/30"
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
                        className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${isTransparent
                            ? 'text-white hover:bg-white/10'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                            }`}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Menu */}
            {menuOpen && (
                <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-2xl px-4 py-4 space-y-2">
                    {NAV_LINKS.map((link) => {
                        const isActive = activeNav === link.href;
                        return (
                            <button
                                key={link.label}
                                onClick={() => handleNavClick(link.href)}
                                className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors cursor-pointer ${isActive
                                    ? 'text-indigo-400 font-semibold bg-slate-900/60'
                                    : 'text-slate-300 font-medium hover:text-white hover:bg-slate-900/40'
                                    }`}
                            >
                                {link.label}
                            </button>
                        );
                    })}

                    <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <>
                                <div className="px-4 py-2.5 flex items-center gap-3 border border-slate-700 bg-slate-900 rounded-xl mb-1 text-slate-200">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    <span className="text-sm font-medium">
                                        {user?.name || user?.firstName || 'User'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer"
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
                                    className="w-full px-4 py-2.5 text-center text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg text-center transition-colors shadow-sm"
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
