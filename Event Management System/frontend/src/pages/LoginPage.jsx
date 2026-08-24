import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';


const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Error clear karo jab user type kare
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic frontend validation
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                navigate('/dashboard'); // Login success → dashboard
            }
        } catch (err) {
            // Axios error → backend ka error message dikhao
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">EMS</div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="auth-error" role="alert">
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={isLoading}
                        id="login-submit-btn"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Link */}
                <p className="auth-switch">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="auth-link">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
