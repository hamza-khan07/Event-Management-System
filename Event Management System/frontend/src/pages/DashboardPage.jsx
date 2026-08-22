import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const roleColors = {
        PRODUCT_MANAGER: '#7c3aed',
        ORGANIZER: '#0891b2',
        PARTICIPANT: '#059669'
    };

    const roleColor = roleColors[user?.role] || '#6b7280';

    return (
        <div className="dashboard-page">
            <div className="dashboard-card">
                <div className="dashboard-header">
                    <div className="dashboard-logo">EMS</div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Day 5 features coming soon</p>
                </div>

                <div className="user-info-card">
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <h2 className="user-name">{user?.name}</h2>
                        <p className="user-email">{user?.email}</p>
                        <span
                            className="user-role-badge"
                            style={{ backgroundColor: roleColor }}
                        >
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {user?.company_id && (
                    <div className="info-row">
                        <span className="info-label">Company ID</span>
                        <span className="info-value">{user.company_id}</span>
                    </div>
                )}

                <div className="info-row">
                    <span className="info-label">Status</span>
                    <span className="info-value" style={{ color: '#059669' }}>✓ Authenticated</span>
                </div>

                <button
                    onClick={handleLogout}
                    className="logout-btn"
                    id="logout-btn"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default DashboardPage;
