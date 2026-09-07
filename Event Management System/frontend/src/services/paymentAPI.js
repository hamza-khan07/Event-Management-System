// frontend/src/services/paymentApi.js
//
// RESPONSIBILITY: Payment API calls frontend se handle karna.
// DRY: Axios setup ek jagah — same pattern jaise eventService.js

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,       // JWT cookie bhejo
    headers: { 'Content-Type': 'application/json' }
});

/**
 * JazzCash payment initiate karo.
 * Backend se form data milega → us data se HTML form auto-submit hoga.
 *
 * @param {number} registrationId - Jis registration ka payment karna hai
 * @returns {Object} { endpoint, formData }
 */
export const initiateJazzCashPayment = async (registrationId) => {
    const response = await api.post('/payments/jazzcash/create', {
        registration_id: registrationId
    });
    return response.data; // { success, data: { endpoint, formData } }
};
