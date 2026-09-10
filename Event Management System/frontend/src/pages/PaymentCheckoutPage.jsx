// frontend/src/pages/PaymentCheckoutPage.jsx
//
// RESPONSIBILITY: Mock payment checkout page — JazzCash jaisi feel.
//
// Flow:
//   1. React Router state se registration_id, amount, event_title lo
//   2. User card details fill kare
//   3. "Pay Now" click → /api/payments/mock/process
//   4. Success → /payment/result?status=success
//   5. Failure → error message dikhao (retry allowed)
//
// State Protection:
//   - Agar state nahi aaya (direct URL access) → /events pe redirect

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    CreditCard, Lock, ShieldCheck,
    AlertCircle, Loader2, ChevronLeft,
    Ticket, Hash, CheckCircle2
} from 'lucide-react';
import { processMockPayment } from '../services/paymentAPI';

// ─── Helper: Card number formatter ────────────────────────────────────────────
// "4111111111111111" → "4111 1111 1111 1111"
const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
};

// ─── Helper: Expiry formatter ─────────────────────────────────────────────────
// "1225" → "12/25"
const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
};

// ─── Card Type Detector ────────────────────────────────────────────────────────
const getCardType = (number) => {
    const clean = number.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    return '';
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const PaymentCheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // React Router state se data lo
    const { registration_id, amount, event_title, ticket_count } = location.state || {};

    // ── Guard: State nahi aaya? → events page pe bhejo ───────────────────────
    useEffect(() => {
        if (!registration_id || !amount) {
            navigate('/events', { replace: true });
        }
    }, [registration_id, amount, navigate]);

    // ── Form State ────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        account_name: '',
        card_number: '',
        expiry: '',
        cvv: '',
    });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingStep, setProcessingStep] = useState('');

    // ── Input Handlers ─────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setError('');

        if (name === 'card_number') {
            setForm(prev => ({ ...prev, card_number: formatCardNumber(value) }));
        } else if (name === 'expiry') {
            setForm(prev => ({ ...prev, expiry: formatExpiry(value) }));
        } else if (name === 'cvv') {
            setForm(prev => ({ ...prev, cvv: value.replace(/\D/g, '').slice(0, 4) }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // ── Submit Handler ─────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Realistic processing animation steps
        const steps = [
            'Connecting to payment gateway...',
            'Verifying card details...',
            'Processing payment...',
            'Confirming transaction...',
        ];

        let stepIndex = 0;
        setProcessingStep(steps[0]);

        const stepInterval = setInterval(() => {
            stepIndex = (stepIndex + 1) % steps.length;
            setProcessingStep(steps[stepIndex]);
        }, 700);

        try {
            const result = await processMockPayment({
                registration_id,
                card_number: form.card_number.replace(/\s/g, ''),
                expiry: form.expiry,
                cvv: form.cvv,
                account_name: form.account_name,
            });

            clearInterval(stepInterval);

            if (result.success && result.paymentStatus === 'SUCCESS') {
                setProcessingStep('Payment confirmed! ✓');
                setTimeout(() => {
                    navigate(
                        `/payment/result?status=success&registration_id=${registration_id}&txn=${result.txn_ref}`,
                        { replace: true }
                    );
                }, 600);
            } else {
                setLoading(false);
                setError(result.message || 'Payment declined. Please try a different card.');
            }
        } catch (err) {
            clearInterval(stepInterval);
            setLoading(false);
            const msg = err.response?.data?.message || 'Payment failed. Please try again.';
            setError(msg);
        }
    };

    // ── Guard render ──────────────────────────────────────────────────────────
    if (!registration_id || !amount) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <Loader2 size={36} className="animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-300 text-sm">Redirecting to events...</p>
            </div>
        );
    }

    const cardType = getCardType(form.card_number);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg">

                {/* ── Header Bar ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Lock size={12} className="text-emerald-400" />
                        256-bit SSL Encrypted
                    </div>
                </div>

                {/* ── Main Card ───────────────────────────────────────────────── */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                    {/* ── Top Brand Bar ──────────────────────────────────────── */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <ShieldCheck size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm leading-none">Eventify</p>
                                <p className="text-indigo-200 text-xs mt-0.5">Secure Payment Gateway</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-indigo-200 text-xs">Amount Due</p>
                            <p className="text-white font-extrabold text-xl">PKR {Number(amount || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* ── Order Summary ──────────────────────────────────────── */}
                    <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-3">
                            Order Summary
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <Ticket size={14} className="text-indigo-400 shrink-0" />
                                <span className="text-white text-sm font-medium flex-1 truncate">{event_title}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Hash size={14} className="text-slate-500 shrink-0" />
                                <span className="text-slate-400 text-xs">
                                    Registration #{registration_id} &middot; {ticket_count} Ticket{ticket_count > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Payment Form ───────────────────────────────────────── */}
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        <p className="text-slate-300 text-xs uppercase tracking-widest font-semibold">
                            Card Details
                        </p>

                        {/* Account / Cardholder Name */}
                        <div>
                            <label htmlFor="account_name" className="block text-xs text-slate-400 font-medium mb-1.5">
                                Cardholder Name
                            </label>
                            <input
                                id="account_name"
                                name="account_name"
                                type="text"
                                value={form.account_name}
                                onChange={handleChange}
                                placeholder="Name as on card"
                                required
                                autoComplete="cc-name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>

                        {/* Card Number */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="card_number" className="block text-xs text-slate-400 font-medium">
                                    Card Number
                                </label>
                                {cardType && (
                                    <span className="text-indigo-400 text-xs font-semibold">{cardType}</span>
                                )}
                            </div>
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    id="card_number"
                                    name="card_number"
                                    type="text"
                                    value={form.card_number}
                                    onChange={handleChange}
                                    placeholder="0000 0000 0000 0000"
                                    required
                                    autoComplete="cc-number"
                                    inputMode="numeric"
                                    maxLength={19}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Expiry + CVV */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="expiry" className="block text-xs text-slate-400 font-medium mb-1.5">
                                    Expiry Date
                                </label>
                                <input
                                    id="expiry"
                                    name="expiry"
                                    type="text"
                                    value={form.expiry}
                                    onChange={handleChange}
                                    placeholder="MM/YY"
                                    required
                                    autoComplete="cc-exp"
                                    inputMode="numeric"
                                    maxLength={5}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label htmlFor="cvv" className="block text-xs text-slate-400 font-medium mb-1.5">
                                    CVV / CVC
                                </label>
                                <input
                                    id="cvv"
                                    name="cvv"
                                    type="password"
                                    value={form.cvv}
                                    onChange={handleChange}
                                    placeholder="&bull;&bull;&bull;"
                                    required
                                    autoComplete="cc-csc"
                                    inputMode="numeric"
                                    maxLength={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
                                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-900/50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={17} className="animate-spin" />
                                    <span>{processingStep}</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={15} />
                                    Pay PKR {Number(amount || 0).toLocaleString()} Securely
                                </>
                            )}
                        </button>

                        {/* Simulation Hint */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                            <p className="text-amber-400 text-xs font-medium">
                                🧪 <span className="font-bold">Test Mode:</span> End card number with{' '}
                                <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">0000</code>{' '}
                                to simulate a failed payment
                            </p>
                        </div>

                        {/* Security Badges */}
                        <div className="flex items-center justify-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <ShieldCheck size={13} className="text-emerald-500" />
                                SSL Secured
                            </div>
                            <div className="w-px h-3 bg-slate-700" />
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Lock size={12} className="text-emerald-500" />
                                PCI Compliant
                            </div>
                            <div className="w-px h-3 bg-slate-700" />
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                3D Secure
                            </div>
                        </div>
                    </form>
                </div>

                {/* Powered By */}
                <p className="text-center text-slate-600 text-xs mt-4">
                    Powered by <span className="text-slate-400 font-semibold">Eventify Pay</span> &middot; Mock Gateway v1.0
                </p>
            </div>
        </div>
    );
};

export default PaymentCheckoutPage;
