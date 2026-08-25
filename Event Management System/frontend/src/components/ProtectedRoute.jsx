import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext.jsx';


/**
 * @param {Array} allowedRoles - (Optional) Un roles ki array jo is page ko dekh sakte hain
 */

/**
 * ProtectedRoute — Kisi bhi page ko wrap karo jo login chahiye.
 * 
 * Agar logged in → page show karo
 * Agar loading → wait karo
 * Agar logged out → /login pe redirect karo
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {  // Default empty array
    const { isAuthenticated, loading, user } = useAuth();

    // 1. Jab tak /me API check ho rahi hai, kuch mat dikhao
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

    // 2. Logged in nahi → Login page pe bhejo
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Agar 'allowedRoles' prop pass kiya gaya hai, toh check karo
    if (allowedRoles && allowedRoles.length > 0 && user) {
        // Agar user ka role allowed roles mein shamil NAHI hai

        if (!allowedRoles.includes(user.role)) {
            // Toh usay wapas normal dashboard par bhej do
            return <Navigate to="/dashboard" replace />;
        }
    }


    // 4. Agar sab theek hai (login bhi hai, aur role bhi match hai), toh page dikhao
    return children;
};


export default ProtectedRoute;

