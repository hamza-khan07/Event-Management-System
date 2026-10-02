const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { sendMessage, clearHistory } = require('../controllers/chatController');

// ─── Chat Routes ───────────────────────────────────────────────────────────────
// protect middleware: sirf logged-in users access kar sakte hain
// authorizeRoles('participant'): sirf participant role walay use kar sakte hain

/**
 * POST /api/chat/message
 * Participant ka message Gemini AI ko bhejta hai aur response return karta hai
 */
router.post('/message', protect, authorizeRoles('PARTICIPANT'), sendMessage);

/**
 * DELETE /api/chat/history
 * Participant ki poori chat history clear karta hai (new conversation start)
 */
router.delete('/history', protect, authorizeRoles('PARTICIPANT'), clearHistory);

module.exports = router;
