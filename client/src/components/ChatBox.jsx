import React, { useState, useRef, useEffect, useCallback, useId } from 'react';

/* ------------------------------------------------------------------ */
/*  Inline icons — no extra icon library dependency required          */
/* ------------------------------------------------------------------ */

const SendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Animated brand logo/avatar — glow breathing, twinkling spark, and */
/*  a bouncing accent dot at rest; an extra pulse ring while "active" */
/*  (i.e. the bot is thinking/typing). Reused at three sizes.         */
/* ------------------------------------------------------------------ */

const LOGO_SIZES = {
  sm: { wrap: 'w-9 h-9', icon: 'w-5 h-5', dot: 'w-2 h-2', spark: 14 },
  md: { wrap: 'w-14 h-14', icon: 'w-8 h-8', dot: 'w-3 h-3', spark: 18 },
  lg: { wrap: 'w-20 h-20', icon: 'w-11 h-11', dot: 'w-4 h-4', spark: 24 },
};

const AnimatedLogo = ({ size = 'sm', active = false }) => {
  const uid = useId();
  const dims = LOGO_SIZES[size];

  return (
    <div className={`relative ${dims.wrap} flex-shrink-0 flex items-center justify-center`}>
      {/* Soft breathing glow behind the avatar */}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 rounded-full blur-md opacity-40 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />

      {/* Extra ring that appears only while the bot is thinking */}
      {active && (
        <div className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/70 motion-safe:animate-ping" />
      )}

      {/* Avatar body — gentle breathing scale */}
      <div
        className={`relative ${dims.wrap} bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-1 shadow-xl border border-purple-500/30 overflow-hidden flex items-center justify-center motion-safe:animate-[pulse_4s_ease-in-out_infinite]`}
      >
        <svg viewBox="0 0 100 100" className={`${dims.icon} drop-shadow-md`}>
          <defs>
            <linearGradient id={`mask-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id={`towel-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id={`skin-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
          </defs>
          <path d="M35 75 Q50 82 65 75 L70 100 L30 100 Z" fill="#FDBA74" />
          <path d="M25 82 Q50 95 75 82 L80 100 L20 100 Z" fill={`url(#towel-${uid})`} />
          <ellipse cx="50" cy="58" rx="18" ry="22" fill={`url(#skin-${uid})`} />
          <path d="M33 52 Q50 42 67 52 Q68 68 50 76 Q32 68 33 52 Z" fill={`url(#mask-${uid})`} opacity="0.9" />
          <path d="M40 56 Q44 60 47 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M53 56 Q56 60 60 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M45 68 Q50 72 55 68" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M30 45 Q50 35 70 45 Q75 35 65 25 Q50 15 35 25 Q25 35 30 45 Z" fill={`url(#towel-${uid})`} />
          <path d="M42 28 Q50 10 58 28 Q50 22 42 28 Z" fill="#F1F5F9" />
          <path d="M36 34 Q50 26 64 34" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
          <path d="M40 28 Q50 20 60 28" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Bouncing accent dot */}
      <span
        className={`absolute -top-0.5 -left-0.5 ${dims.dot} rounded-full bg-emerald-300 border border-emerald-600 motion-safe:animate-bounce`}
        style={{ animationDuration: '3s' }}
      />

      {/* Twinkling spark */}
      <svg
        className="absolute -top-1 -right-1 motion-safe:animate-[pulse_1.8s_ease-in-out_infinite]"
        width={dims.spark}
        height={dims.spark}
        viewBox="0 0 20 20"
      >
        <path d="M10 2 L11.5 8 L18 10 L11.5 12 L10 18 L8.5 12 L2 10 L8.5 8 Z" fill="#FDE047" />
      </svg>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Single message bubble                                             */
/* ------------------------------------------------------------------ */

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <AnimatedLogo size="sm" />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={
            isUser
              ? 'px-4 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white shadow-sm'
              : 'px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 shadow-sm'
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {time && (
          <span className="mt-1 text-[10px] text-gray-400 dark:text-slate-500 px-1">{time}</span>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty state with suggested prompts                                */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "What's a good routine for oily, acne-prone skin?",
  'Recommend a gentle cleanser for sensitive skin',
  'How do I fade acne scars safely?',
  'Which sunscreen works best under makeup?',
];

const EmptyState = ({ onPick }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
    <AnimatedLogo size="lg" />
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Skin Affairs
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Ask me anything about your skin.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="text-left text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main ChatBox                                                      */
/* ------------------------------------------------------------------ */

/**
 * Props:
 * - onSend(text): optional async function. Return the assistant's reply
 *   string (or a promise resolving to one). If omitted, a demo reply is
 *   used so the component works standalone.
 * - initialMessages: optional array of { id, role, content, timestamp }
 * - placeholder: optional input placeholder text
 */
const ChatBox = ({ onSend, initialMessages = [], placeholder = 'Message Skin Affairs…' }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef(null);
  const scrollAnchorRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize the textarea as the user types, capped at ~6 lines
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSend = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || isTyping) return;

      const userMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      resetTextareaHeight();
      setIsTyping(true);

      try {
        const reply = onSend
          ? await onSend(text)
          : await new Promise((resolve) =>
              setTimeout(() => resolve("Thanks for your question — connect this component's onSend prop to your backend to get real answers here."), 900)
            );

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: String(reply), timestamp: Date.now() },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Something went wrong sending that. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, onSend]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <AnimatedLogo size="sm" active={isTyping} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Skin Affairs</span>
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyState onPick={(s) => handleSend(s)} />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isTyping && (
            <div className="flex items-end gap-2">
              <AnimatedLogo size="sm" active />
              <TypingIndicator />
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex-shrink-0">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition-shadow">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none max-h-40"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-gray-400 dark:text-slate-500">
          Enter to send • Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
