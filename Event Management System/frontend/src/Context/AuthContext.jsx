import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getCurrentUser, registerUser } from '../services/authService';

// Initialize context object
const AuthContext = createContext(null);

/**
 * AuthProvider — Root authentication wrapper.
 * Provides user state and authentication methods via useAuth() hook.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);          // Current logged-in user
    const [loading, setLoading] = useState(true);     // Session verification loading indicator

    // ── Check existing session on application mount ──
    // Checks for a valid session cookie to restore login state automatically
    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await getCurrentUser();
                if (data.success) {
                    setUser(data.user);
                }
            } catch (error) {
                // 401 = No active session
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    // ── Login Function ──
    const login = async (email, password) => {
        const data = await loginUser(email, password);
        if (data.success) {
            setUser(data.user);
        }
        return data;
    };

    // ── Register Function ──
    const register = async (name, email, password, confirmPassword) => {
        const data = await registerUser(name, email, password, confirmPassword);
        return data;
    };

    // ── Logout Function ──
    const logout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            // Even if API call fails, clear frontend state
        } finally {
            setUser(null);
        }
    };

    // Global context value object
    const value = {
        user,
        isAuthenticated: !!user,   // Boolean flag: true if user is logged in
        loading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook for accessing authentication context:
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};
