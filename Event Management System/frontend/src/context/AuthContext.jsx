import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getCurrentUser, registerUser } from '../services/authService';

// Context object banao
const AuthContext = createContext(null);

/**
 * AuthProvider — Ye poori app ko wrap karta hai.
 * Iske andar koi bhi component useAuth() se user info le sakta hai.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);          // Current logged-in user
    const [loading, setLoading] = useState(true);     // App load ho rahi hai check karte hue

    // ── App load hone par check karo kya user already logged in hai ──
    // Agar valid cookie hai (7 din ke andar) to user ko dobara login nahi karna
    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await getCurrentUser();
                if (data.success) {
                    setUser(data.user);
                }
            } catch (error) {
                // 401 = koi session nahi, that's fine
                setUser(null);
            } finally {
                setLoading(false);  // Loading done chahe session ho ya na ho
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

    // Jo values poori app mein available hongi
    const value = {
        user,
        isAuthenticated: !!user,   // true agar user object hai, false agar null
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
 * Custom hook — kisi bhi component mein use karo:
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};
