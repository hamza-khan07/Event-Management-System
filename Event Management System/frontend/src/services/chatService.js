import axios from 'axios';
import { API_URL } from '../config/api';

// Same axios instance pattern as other services — withCredentials for cookie-based auth
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

/**
 * Send a message to the AI chatbot
 * @param {string} message - User's message text
 * @returns {Promise<{success: boolean, data: {reply: string, timestamp: string}}>}
 */
export const sendChatMessage = async (message) => {
    const response = await api.post('/chat/message', { message });
    return response.data;
};

/**
 * Clear the user's conversation history on the backend
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const clearChatHistory = async () => {
    const response = await api.delete('/chat/history');
    return response.data;
};
