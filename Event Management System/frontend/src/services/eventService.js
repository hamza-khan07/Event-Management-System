// frontend/src/services/eventService.js
//
// RESPONSIBILITY: Events ke liye sab API calls ek jagah.
//
// DRY: Axios instance wahi configuration use karta hai jo registrationService mein hai.
// Agar kal ko baseURL change ho, sirf yahan ek jagah change karna hoga.

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,       // Cookies bhejo — JWT auth ke liye
    headers: { 'Content-Type': 'application/json' }
});

// ─── Get All Public Events ────────────────────────────────────────────────────
// Landing page aur AllEventsPage dono yeh use karte hain.
// params: { search, category, page, limit } — sab optional
export const getPublicEvents = async (params = {}) => {
    const response = await api.get('/events/public', { params });
    return response.data;   // { success, data: [...], pagination: {...} }
};

// ─── Get Single Public Event By ID ───────────────────────────────────────────
// EventDetailPage ke liye — URL param se ID aata hai
export const getPublicEventById = async (id) => {
    const response = await api.get(`/events/public/${id}`);
    return response.data;   // { success, data: { id, title, ... } }
};
