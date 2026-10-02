import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, clearChatHistory } from '../services/chatService';
import { useAuth } from '../Context/AuthContext';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13zm9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13zM3 21h18v-2H3v2z"/>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
  </svg>
);

const ChatBubbleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
      <BotIcon />
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ─── Single Message Bubble ────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isBot = msg.sender === 'bot';
  return (
    <div className={`flex items-end gap-2 mb-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <BotIcon />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-md text-xs font-bold">
          U
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isBot
            ? 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
            : 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-2xl rounded-br-sm'
        }`}
      >
        {msg.text.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
        <div className={`text-[10px] mt-1 ${isBot ? 'text-gray-400' : 'text-violet-200'}`}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

// ─── Main ChatWidget ──────────────────────────────────────────────────────────
const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm EventBot, your AI assistant.\n\nI can help you with:\n• Event details & schedules\n• Registration & tickets\n• Payment queries\n• Platform navigation\n\nHow can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens + clear badge
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Sirf PARTICIPANT role wale logged-in users ko dikhao
  if (!isAuthenticated || user?.role !== 'PARTICIPANT') return null;

  // ── Send Message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: trimmed, time: now }]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(trimmed);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.data.reply, time: botTime }]);
      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || '⚠️ Sorry, I ran into an issue. Please try again.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'bot',
        text: errorMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Clear History ─────────────────────────────────────────────────────────────
  const handleClear = async () => {
    setIsClearing(true);
    try { await clearChatHistory(); } catch (_) { /* reset UI even on error */ }
    setMessages([{
      id: Date.now(), sender: 'bot',
      text: 'Chat cleared! 🔄 Ready for a fresh conversation.\n\nHow can I help you?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsClearing(false);
  };

  const suggestions = [
    'How do I register for an event?',
    'Where can I find my ticket?',
    'What events are upcoming?',
    'How do I contact the organizer?'
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Trigger Button (bottom-right, always shows chat icon) ──── */}
      <button
        id="chat-widget-toggle-btn"
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-violet-500/40"
        aria-label="Toggle AI Chat"
      >
        {/* New message notification badge */}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
        {/* Always show chat icon — no toggling to X here */}
        <ChatBubbleIcon />
      </button>

      {/* ── Chat Window ──────────────────────────────────────────────────────── */}
      {/* 
        Positioning strategy:
        - bottom: 5.5rem  → enough space above the floating button (56px button + 16px gap + 16px extra)
        - max-height: calc(100vh - 10rem) → won't go behind the navbar (accounts for ~64px navbar + button area)
        - right-6 → aligned with the floating button
      */}
      <div
        id="chat-widget-window"
        className={`fixed right-6 z-40 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
        style={{
          bottom: '5.5rem',                          // Clears floating button
          maxHeight: 'calc(100vh - 10rem)',           // Won't overlap navbar
          height: '520px',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <BotIcon />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">EventBot</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-violet-200 text-[11px]">AI Assistant • Online</span>
              </div>
            </div>
          </div>

          {/* Header right — trash + close buttons */}
          <div className="flex items-center gap-1">
            {/* Clear history button */}
            <button
              id="chat-clear-history-btn"
              onClick={handleClear}
              disabled={isClearing}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40"
              title="Clear chat history"
            >
              <TrashIcon />
            </button>

            {/* ✅ Close button — top-right corner of chat window */}
            <button
              id="chat-close-btn"
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200"
              title="Close chat"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* ── Messages Area ─────────────────────────────────────────────────── */}
        <div
          id="chat-messages-container"
          className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Suggestion Chips (only on welcome screen) ───────────────── */}
        {messages.length === 1 && !isLoading && (
          <div className="flex-shrink-0 px-3 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInputText(s); inputRef.current?.focus(); }}
                className="text-[11px] bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-400 px-2.5 py-1 rounded-full transition-all duration-200 font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input Area ────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all duration-200">
            <textarea
              id="chat-input-textarea"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-gray-800 resize-none outline-none placeholder-gray-400 max-h-24 disabled:opacity-50 leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <button
              id="chat-send-btn"
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-md shadow-violet-500/30"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            Powered by Google Gemini AI ✨
          </p>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
