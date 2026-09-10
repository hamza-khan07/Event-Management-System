import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext.jsx';

/**
 * ProtectedRoute component:
 * 
 * - Shows loading indicator while session check (/me) is in flight.
 * - Redirects unauthenticated users to /login.
 * - Enforces role-based access if 'allowedRoles' is supplied.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, loading, user } = useAuth();

    // 1. Show loading state while session verification is running
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

    // 2. Redirect to login if user is not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Enforce allowed roles if specified
    if (allowedRoles && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
            // Redirect unauthorized users back to default dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 4. Render children if authenticated and authorized
    return children;
};

export default ProtectedRoute;
