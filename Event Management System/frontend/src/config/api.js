// frontend/src/config/api.js
// Centralized API configuration supporting both local development and production deployments

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Strip any trailing slash if provided in env
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

// Ensure /api endpoint is cleanly appended without duplicating
export const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export default API_URL;
