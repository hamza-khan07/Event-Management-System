// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../components/AuthLayout';

/* ── Inline SVG icons ────────────────────────────────────────────── */
const UserCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const EnvelopeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
    </svg>
);
const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
);
const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const EyeIcon = ({ show }) => show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

/* ── Underline input with left icon ────────────────────────────────── */
const UnderlineInput = ({ icon, type, name, placeholder, value, onChange, disabled, rightEl }) => (
    <div className="w-full flex items-center gap-3 border-b border-white/30 pb-2 group focus-within:border-white/70 transition-colors duration-200">
        <span className="text-white/60 shrink-0 group-focus-within:text-white/90 transition-colors">{icon}</span>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoComplete="off"
            className="flex-1 bg-transparent text-white placeholder-white/45 text-sm outline-none disabled:opacity-50"
        />
        {rightEl && <span className="shrink-0">{rightEl}</span>}
    </div>
);

/* ══════════════════════════════════════════════════════════════════ */
const RegisterPage = () => {
    const { register } = useAuth();
    const navigate     = useNavigate();

    const [formData, setFormData]     = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPwd, setShowPwd]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [isLoading, setIsLoading]   = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
            setError('All fields are required.'); return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.'); return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.'); return;
        }
        setIsLoading(true);
        try {
            const result = await register(formData.name, formData.email, formData.password, formData.confirmPassword);
            if (result.success) {
                setSuccess('Account created! Redirecting…');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            {/* ── Avatar ── */}
            <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
                style={{ background: 'rgba(10,40,80,0.65)', border: '2px solid rgba(255,255,255,0.2)' }}
            >
                <UserCircleIcon />
            </div>

            {/* ── Title ── */}
            <h1 className="text-white text-sm font-semibold tracking-[0.25em] uppercase mb-8 text-center">
                Create Account
            </h1>

            {/* ── Alerts ── */}
            {error && (
                <div className="w-full mb-5 text-red-300 text-xs text-center bg-red-900/30 rounded-lg py-2 px-3">
                    {error}
                </div>
            )}
            {success && (
                <div className="w-full mb-5 text-green-300 text-xs text-center bg-green-900/30 rounded-lg py-2 px-3">
                    ✓ {success}
                </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
                <UnderlineInput
                    icon={<UserIcon />}
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                />

                <UnderlineInput
                    icon={<EnvelopeIcon />}
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                />

                <UnderlineInput
                    icon={<LockIcon />}
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    rightEl={
                        <button type="button" onClick={() => setShowPwd(p => !p)}
                            className="text-white/50 hover:text-white/90 transition-colors">
                            <EyeIcon show={showPwd} />
                        </button>
                    }
                />

                <UnderlineInput
                    icon={<ShieldIcon />}
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    rightEl={
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                            className="text-white/50 hover:text-white/90 transition-colors">
                            <EyeIcon show={showConfirm} />
                        </button>
                    }
                />

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg text-white text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98] mt-2"
                    style={{ background: 'rgba(10,40,80,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                    {isLoading ? 'Creating Account…' : 'Register'}
                </button>
            </form>

            {/* ── Footer link ── */}
            <p className="mt-7 text-white/45 text-xs text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;
