const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// ─── Initialize Gemini Client ─────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Model Configurations ─────────────────────────────────────────────────────
// Primary: gemini-flash-lite-latest (fastest response <1s, high stability, no 503s)
// Fallback: gemini-3.1-flash-lite (seamless backup if primary ever experiences high load)
const PRIMARY_MODEL = 'gemini-flash-lite-latest';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

// ─── Cache System Prompt with Real DB Events ──────────────────────────────────
let cachedPrompt = null;
let promptCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

const getSystemPrompt = async () => {
    const now = Date.now();
    if (cachedPrompt && (now - promptCacheTime < CACHE_TTL_MS)) {
        return cachedPrompt;
    }

    let eventsInfo = 'Currently, there are no upcoming published events listed in the database.';
    try {
        const [rows] = await db.query(
            `SELECT title, category, venue, event_date, start_time, price 
             FROM events 
             WHERE status = 'PUBLISHED' 
             ORDER BY event_date ASC 
             LIMIT 10`
        );

        if (rows && rows.length > 0) {
            eventsInfo = rows.map((e, idx) => {
                const dateStr = e.event_date ? new Date(e.event_date).toDateString() : 'TBA';
                const timeStr = e.start_time ? ` at ${e.start_time}` : '';
                const priceStr = e.price ? ` | Ticket: PKR ${e.price}` : ' | Ticket: Free';
                return `${idx + 1}. **${e.title}** (${e.category || 'General'})\n   - Date & Time: ${dateStr}${timeStr}\n   - Venue: ${e.venue || 'Online'}${priceStr}`;
            }).join('\n\n');
        }
    } catch (dbErr) {
        console.warn('Could not fetch events for chatbot prompt:', dbErr.message);
    }

    cachedPrompt = `You are "EventBot", the official AI assistant for this Event Management System (EMS).
Your job is to provide fast, polite, and accurate assistance to participants.

=== REAL UPCOMING EVENTS ON PLATFORM ===
${eventsInfo}
========================================

Your Capabilities & Knowledge:
1. When asked about upcoming events or recommendations, present the real events from the list above with their date, location, and ticket price.
2. If asked about how to register: Explain that they can browse events, click on any event, and click the "Register" button.
3. If asked about tickets: Inform them that their registered events and tickets are available in the "My Events" / "Dashboard" section.
4. If asked about organizers or help: Advise them to contact the event organizer via the event details page.
5. Language: Always respond in the exact same language the user speaks (Urdu, Roman Urdu, or English).
6. Tone: Friendly, concise, professional, and well-structured using markdown bullets when helpful.
7. Strict Rule: Only discuss event, ticketing, and platform topics. Politely decline off-topic queries.`;

    promptCacheTime = now;
    return cachedPrompt;
};

// ─── Active User Chat Sessions Store ──────────────────────────────────────────
// Map: userId -> { chat: ChatSession, modelName: string, lastActive: number }
const userSessions = new Map();

// Periodic cleanup of sessions inactive for > 1 hour
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [userId, session] of userSessions.entries()) {
        if (session.lastActive < oneHourAgo) {
            userSessions.delete(userId);
        }
    }
}, 15 * 60 * 1000);

// Helper to create a new chat session for a user
const createChatSession = async (modelName) => {
    const systemInstruction = await getSystemPrompt();
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
    });

    return model.startChat({
        generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7,
        }
    });
};

// ─── Controller: Send Message ─────────────────────────────────────────────────
/**
 * POST /api/chat/message
 * Handles participant messages with automatic model fallback & robust session persistence.
 */
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        // Validation
        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
        }

        if (message.trim().length > 1000) {
            return res.status(400).json({ success: false, message: 'Message is too long. Please keep it under 1000 characters.' });
        }

        const trimmedMsg = message.trim();

        // Retrieve existing session or initialize new one
        let session = userSessions.get(userId);
        if (!session) {
            const chat = await createChatSession(PRIMARY_MODEL);
            session = {
                chat,
                modelName: PRIMARY_MODEL,
                lastActive: Date.now()
            };
            userSessions.set(userId, session);
        }

        let botReply = '';

        try {
            // Attempt to send message to primary session
            const result = await session.chat.sendMessage(trimmedMsg);
            botReply = result.response.text();
            session.lastActive = Date.now();
        } catch (primaryError) {
            console.warn(`Primary model (${session.modelName}) failed: ${primaryError.message}. Switching to fallback...`);

            // Try fallback model
            const fallbackChat = await createChatSession(FALLBACK_MODEL);
            const result = await fallbackChat.sendMessage(trimmedMsg);
            botReply = result.response.text();

            // Update user session with the fallback chat
            session.chat = fallbackChat;
            session.modelName = FALLBACK_MODEL;
            session.lastActive = Date.now();
        }

        return res.status(200).json({
            success: true,
            data: {
                reply: botReply,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Chat Controller Error:', error.message || error);

        // Reset session so that next request starts cleanly
        if (req.user && req.user.id) {
            userSessions.delete(req.user.id);
        }

        if (error.message?.includes('API_KEY_INVALID')) {
            return res.status(500).json({
                success: false,
                message: 'AI service configuration issue. Please check Gemini API key.'
            });
        }

        if (error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('high demand')) {
            return res.status(503).json({
                success: false,
                message: 'AI service is experiencing high demand. Please try again in a few seconds.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to process message. Please try again.'
        });
    }
};

// ─── Controller: Clear Chat History ──────────────────────────────────────────
/**
 * DELETE /api/chat/history
 * Clears the active chat session for this user.
 */
const clearHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        userSessions.delete(userId);
        return res.status(200).json({ success: true, message: 'Chat history cleared successfully.' });
    } catch (error) {
        console.error('Clear History Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to clear chat history.' });
    }
};

module.exports = { sendMessage, clearHistory };
