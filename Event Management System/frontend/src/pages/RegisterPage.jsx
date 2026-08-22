import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Frontend validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.confirmPassword
            );

            if (result.success) {
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join as a Participant</p>
                </div>

                {/* Error / Success Messages */}
                {error && (
                    <div className="auth-error" role="alert">
                        <span>⚠</span> {error}
                    </div>
                )}
                {success && (
                    <div className="auth-success" role="status">
                        <span>✓</span> {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="register-name" className="form-label">Full Name</label>
                        <input
                            id="register-name"
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="register-email" className="form-label">Email Address</label>
                        <input
                            id="register-email"
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
                        <label htmlFor="register-password" className="form-label">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="At least 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="register-confirm" className="form-label">Confirm Password</label>
                        <input
                            id="register-confirm"
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="Repeat your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={isLoading}
                        id="register-submit-btn"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
