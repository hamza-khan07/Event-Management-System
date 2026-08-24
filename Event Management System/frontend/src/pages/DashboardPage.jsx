import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const roleColors = {
        PRODUCT_MANAGER: 'bg-purple-100 text-purple-700',
        ORGANIZER: 'bg-cyan-100 text-cyan-700',
        PARTICIPANT: 'bg-emerald-100 text-emerald-700'
    };

    const roleStyle = roleColors[user?.role] || 'bg-gray-100 text-gray-700';

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-10">
                {/* Header Area */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
                            EMS
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-600 font-medium transition-colors text-sm px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-8">
                    {/* User Profile Card */}
                    <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl mb-8 border border-gray-100">
                        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                            <p className="text-gray-500 mt-1">{user?.email}</p>
                            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${roleStyle}`}>
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Conditional Role-Based UI */}
                    <div className="mt-8 border-t border-gray-100 pt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>

                        {(user?.role === 'ORGANIZER' || user?.role === 'PRODUCT_MANAGER') && (
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                                + Create New Event
                            </button>
                        )}

                        {user?.role === 'PARTICIPANT' && (
                            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg">
                                <p className="font-medium">Welcome! Browse events and register to attend.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
