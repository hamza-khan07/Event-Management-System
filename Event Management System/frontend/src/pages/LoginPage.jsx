// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../components/AuthLayout';

/* ── Inline SVG icons (no extra package needed) ─────────────────── */
const UserCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
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
const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.'); return;
        }
        setIsLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                if (result.user.role === 'PRODUCT_MANAGER') navigate('/dashboard');
                else if (result.user.role === 'ORGANIZER') navigate('/organizer/dashboard');
                else navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                Login
            </h1>

            {/* ── Error ── */}
            {error && (
                <div className="w-full mb-5 text-red-300 text-xs text-center bg-red-900/30 rounded-lg py-2 px-3">
                    {error}
                </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
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

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={e => setRemember(e.target.checked)}
                            className="accent-white w-3.5 h-3.5 rounded cursor-pointer"
                        />
                        <span className="text-white/60 text-xs">Remember me</span>
                    </label>
                    <Link to="/forgot-password"
                        className="text-white/60 text-xs hover:text-white transition-colors">
                        Forgot Password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg text-white text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'rgba(10,40,80,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                    {isLoading ? 'Signing in…' : 'Login'}
                </button>
            </form>

            {/* ── Footer link ── */}
            <p className="mt-7 text-white/45 text-xs text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;
