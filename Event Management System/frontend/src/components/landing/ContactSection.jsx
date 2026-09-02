// frontend/src/components/landing/ContactSection.jsx
//
// RESPONSIBILITY: Contact Us section with contact information and inquiry form.

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

const INITIAL_FORM_STATE = {
    name: '',
    email: '',
    subject: '',
    message: '',
};

const ContactSection = () => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [status, setStatus] = useState({ submitted: false, loading: false });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ submitted: false, loading: true });

        // Simulate clean asynchronous submission
        setTimeout(() => {
            setStatus({ submitted: true, loading: false });
            setFormData(INITIAL_FORM_STATE);
        }, 600);
    };

    const handleReset = () => {
        setStatus({ submitted: false, loading: false });
    };

    return (
        <section id="contact" className="py-5 bg-gray-50 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3">
                        <MessageSquare size={14} />
                        <span>Get In Touch</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                        Have Questions? Let's Talk
                    </h2>
                    <p className="mt-3 text-base text-gray-600">
                        Whether you are planning to host an event or have questions about tickets, our team is here to assist you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Mail size={22} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Email Us</h4>
                                <p className="text-sm text-gray-500 mt-0.5">Our friendly team is here to help.</p>
                                <a
                                    href="mailto:support@eventify.com"
                                    className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block"
                                >
                                    support@eventify.com
                                </a>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Phone size={22} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Call Us</h4>
                                <p className="text-sm text-gray-500 mt-0.5">Mon-Fri from 9am to 6pm PKT.</p>
                                <a
                                    href="tel:+923001234567"
                                    className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block"
                                >
                                    +92 (300) 123-4567
                                </a>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Visit Our Office</h4>
                                <p className="text-sm text-gray-500 mt-0.5">Come say hello at our hub.</p>
                                <p className="text-sm font-medium text-gray-800 mt-1">
                                    Gulberg III, Main Boulevard, Lahore, Pakistan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-sm">
                        {status.submitted ? (
                            <div className="text-center py-10">
                                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Message Received!</h3>
                                <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                                    Thank you for reaching out. A member of our support team will respond to you within 24 hours.
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="mt-6 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Hamza Khan"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="How can we help you?"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        name="message"
                                        rows={4}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Write your message here..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status.loading}
                                    className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                                >
                                    <Send size={16} />
                                    <span>{status.loading ? 'Sending Message...' : 'Send Message'}</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
