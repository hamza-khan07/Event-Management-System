import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jx';

/**
 * ProtectedRoute — Kisi bhi page ko wrap karo jo login chahiye.
 * 
 * Agar logged in → page show karo
 * Agar loading → wait karo
 * Agar logged out → /login pe redirect karo
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Jab tak /me API check ho rahi hai, kuch mat dikhao
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '18px',
                color: '#6b7280'
            }}>
                Loading...
            </div>
        );
    }

    // Logged in nahi → Login page pe bhejo
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Logged in → page dikhao
    return children;
};

export default ProtectedRoute;
