import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (Aapki logic same rahegi) ...
        setError('');
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.'); return;
        }
        setIsLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Wrapper use kiya aur props pass kiye
        <AuthLayout title="Welcome Back" subtitle="Sign in to your account">

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <span>⚠</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Kitna clean ho gaya! */}
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">Create one</Link>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;
