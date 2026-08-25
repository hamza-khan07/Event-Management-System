import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: ''
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
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // AuthLayout use kar ke title aur subtitle pass kar diye
        <AuthLayout title="Create Account" subtitle="Join as a Participant">

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <span>⚠</span> {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <span>✓</span> {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* 4 lambe HTML inputs ki jagah ab sirf ye 4 lines */}
                <FormInput
                    label="Full Name"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                />
                <FormInput
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                />
                <FormInput
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                />
                <FormInput
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                />

                <button
                    type="submit" disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-4 disabled:opacity-50"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;
