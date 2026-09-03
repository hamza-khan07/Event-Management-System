// frontend/src/services/registrationService.js
//
// RESPONSIBILITY: Registration ke sab API calls ek jagah rakhna.
//
// DRY Principle: authService.js mein already `api` (axios instance) ban chuka hai —
// lekin woh file mein define hai. Yahan apna axios instance banate hain same config se.
// Future improvement: ek shared `api.js` instance bana sakte hain (single source of truth).
//
// withCredentials: true → cookies har request ke saath jayengi (JWT auth ke liye zaroori)

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,          // Cookies bhejo — JWT authentication ka dil
    headers: { 'Content-Type': 'application/json' }
});

// ─── Register for an Event ────────────────────────────────────────────────────
// eventId: URL param (event ka database ID)
// data: { ticket_count: number, phone_number: string | null }
export const registerForEvent = async (eventId, data) => {
    const response = await api.post(`/registrations/${eventId}`, data);
    return response.data;
};

// ─── Cancel My Registration ───────────────────────────────────────────────────
// registrationId: apni registration ka ID (jo registerForEvent se mila tha)
export const cancelRegistration = async (registrationId) => {
    const response = await api.put(`/registrations/${registrationId}/cancel`);
    return response.data;
};

// ─── Get My All Registrations ─────────────────────────────────────────────────
// Logged-in user ki sab past + current registrations
export const getMyRegistrations = async () => {
    const response = await api.get('/registrations/my');
    return response.data;
};

// ─── Get Event Capacity Info (Public) ────────────────────────────────────────
// Returns: { booked, total, available, isFull }
// Modal mein "X / Y registered" dikhane ke liye — no auth needed
export const getEventCapacity = async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}/capacity`);
    return response.data;
};

