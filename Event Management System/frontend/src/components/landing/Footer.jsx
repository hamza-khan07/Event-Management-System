// frontend/src/components/landing/Footer.jsx
//
// RESPONSIBILITY: Clean, professional landing page footer.

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, Phone, MapPin, Share2, Globe, Link2, ArrowUp } from 'lucide-react';

const QUICK_LINKS = [
    { label: 'Discover', href: '#discover' },
    { label: 'Explore Events', href: '#events' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact Us', href: '#contact' },
];

const CATEGORIES = [
    'Concerts & Music',
    'Tech & Conferences',
    'Food & Festivals',
    'Art & Workshops',
    'Sports & Outdoor',
    'Business & Networking',
];

const Footer = () => {
    const year = new Date().getFullYear();

    const scrollTo = (href) => {
        if (!href.startsWith('#')) return;
        const el = document.querySelector(href);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-gray-950 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

                    {/* Brand & Mission */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Calendar size={16} className="text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">Eventify</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
                            Your gateway to discovering the most exciting events. From music festivals and
                            conferences to creative workshops, find it all on Eventify.
                        </p>
                        <div className="flex items-center gap-2.5">
                            <a
                                href="#twitter"
                                aria-label="Twitter"
                                className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-colors"
                            >
                                <Share2 size={15} />
                            </a>
                            <a
                                href="#linkedin"
                                aria-label="LinkedIn"
                                className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-colors"
                            >
                                <Globe size={15} />
                            </a>
                            <a
                                href="#instagram"
                                aria-label="Instagram"
                                className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-colors"
                            >
                                <Link2 size={15} />
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="lg:col-span-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
                            Navigation
                        </h4>
                        <ul className="space-y-3">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.label}>
                                    <button
                                        onClick={() => scrollTo(link.href)}
                                        className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Event Categories */}
                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
                            Categories
                        </h4>
                        <ul className="space-y-3">
                            {CATEGORIES.map((cat) => (
                                <li key={cat}>
                                    <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-default">
                                        {cat}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
                            Contact Info
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-2.5 text-sm">
                                <MapPin size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                                <span>Gulberg III, Main Boulevard, Lahore, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-sm">
                                <Mail size={15} className="text-indigo-400 shrink-0" />
                                <a href="mailto:support@eventify.com" className="hover:text-white transition-colors">
                                    support@eventify.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5 text-sm">
                                <Phone size={15} className="text-indigo-400 shrink-0" />
                                <a href="tel:+923001234567" className="hover:text-white transition-colors">
                                    +92 300 123 4567
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        &copy; {year} Eventify. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-xs text-gray-500">
                        <a href="#privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            aria-label="Back to top"
                        >
                            <span>Back to top</span>
                            <ArrowUp size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;