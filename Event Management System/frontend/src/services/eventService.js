// frontend/src/services/eventService.js
//
// RESPONSIBILITY: Centralized API calls for event resources.

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,       // Send cookies for authentication
    headers: { 'Content-Type': 'application/json' }
});

// ─── Get All Public Events ────────────────────────────────────────────────────
// Used across LandingPage and AllEventsPage.
// params: { search, category, page, limit } — all optional
export const getPublicEvents = async (params = {}) => {
    const response = await api.get('/events/public', { params });
    return response.data;   // { success, data: [...], pagination: {...} }
};

// ─── Get Single Public Event By ID ───────────────────────────────────────────
// Used by EventDetailPage — event ID retrieved from URL route params
export const getPublicEventById = async (id) => {
    const response = await api.get(`/events/public/${id}`);
    return response.data;   // { success, data: { id, title, ... } }
};
