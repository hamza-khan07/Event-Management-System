import axios from 'axios';

// Base URL of our backend API
// withCredentials: true is CRITICAL — it tells axios to send cookies with every request
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,   // Cookies bhejo har request ke saath
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Register a new PARTICIPANT account
 */
export const registerUser = async (name, email, password, confirmPassword) => {
    const response = await api.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword
    });
    return response.data;
};

/**
 * Login with email and password
 */
export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

/**
 * Logout current user
 */
export const logoutUser = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

/**
 * Get currently logged-in user (uses cookie automatically)
 */
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
