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
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                navigate('/dashboard');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
                        EMS
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
