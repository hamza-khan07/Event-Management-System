// frontend/src/services/paymentAPI.js
//
// RESPONSIBILITY: Handle payment API requests from frontend.

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// Attach auth token if present in localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/**
 * Process simulated mock payment transaction.
 *
 * @param {Object} payload - { registration_id, card_number, expiry, cvv, account_name }
 * @returns {Object} { success, paymentStatus, txn_ref, registration_id, amount }
 */
export const processMockPayment = async (payload) => {
    const response = await api.post('/payments/mock/process', payload);
    return response.data;
};
