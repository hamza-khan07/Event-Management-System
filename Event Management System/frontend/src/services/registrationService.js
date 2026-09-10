// frontend/src/services/registrationService.js
//
// RESPONSIBILITY: Centralized API requests for event registrations.

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,          // Include cookies for authentication
    headers: { 'Content-Type': 'application/json' }
});

// ─── Register for an Event ────────────────────────────────────────────────────
// eventId: URL param (event ID)
// data: { ticket_count: number, phone_number: string | null }
export const registerForEvent = async (eventId, data) => {
    const response = await api.post(`/registrations/${eventId}`, data);
    return response.data;
};

// ─── Cancel My Registration ───────────────────────────────────────────────────
// registrationId: Registration ID to cancel
export const cancelRegistration = async (registrationId) => {
    const response = await api.put(`/registrations/${registrationId}/cancel`);
    return response.data;
};

// ─── Get My All Registrations ─────────────────────────────────────────────────
// Returns all past and current registrations for the logged-in user
export const getMyRegistrations = async () => {
    const response = await api.get('/registrations/my');
    return response.data;
};

// ─── Get Event Capacity Info (Public) ────────────────────────────────────────
// Returns: { booked, total, available, isFull }
// Used by registration modal to display available capacity
export const getEventCapacity = async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}/capacity`);
    return response.data;
};
