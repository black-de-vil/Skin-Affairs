import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect, useId } from 'react';
import Markdown from './Markdown';

/* ------------------------------------------------------------------ */
/*  Inline icons — no extra icon library dependency required          */
/* ------------------------------------------------------------------ */

const SendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ArrowDownIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Brand mark                                                        */
/*                                                                    */
/*  Two variants on purpose:                                          */
/*  - AnimatedLogo: glow, spark and pulse. Used ONCE (header / empty   */
/*    state) because each instance runs several infinite animations    */
/*    over a blurred layer, which the compositor re-paints forever.    */
/*  - StaticLogo: the same mark with no animation and no blur. Used    */
/*    next to every assistant bubble, where dozens of animated copies  */
/*    used to stack up and make scrolling and typing stutter.          */
/* ------------------------------------------------------------------ */

const LOGO_SIZES = {
  sm: { wrap: 'w-9 h-9', icon: 'w-5 h-5', dot: 'w-2 h-2', spark: 14 },
  md: { wrap: 'w-14 h-14', icon: 'w-8 h-8', dot: 'w-3 h-3', spark: 18 },
  lg: { wrap: 'w-20 h-20', icon: 'w-11 h-11', dot: 'w-4 h-4', spark: 24 },
};

const LogoFace = ({ uid, className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
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
);

const StaticLogo = React.memo(({ size = 'sm' }) => {
  const uid = useId();
  const dims = LOGO_SIZES[size];
  return (
    <div
      className={`relative ${dims.wrap} flex-shrink-0 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-1 shadow-sm border border-purple-500/30 overflow-hidden flex items-center justify-center`}
    >
      <LogoFace uid={uid} className={dims.icon} />
    </div>
  );
});

StaticLogo.displayName = 'StaticLogo';

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
        <LogoFace uid={uid} className={`${dims.icon} drop-shadow-md`} />
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
        aria-hidden="true"
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
        className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Single message bubble                                             */
/* ------------------------------------------------------------------ */

const MessageBubble = React.memo(({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const status = message.status || 'sent';
  // Photos attached to this message; tolerates both array form (current)
  // and a legacy single-string form from older stored messages.
  const images = Array.isArray(message.image)
    ? message.image
    : message.image
      ? [message.image]
      : [];
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const bubbleClass = isUser
    ? `px-4 py-2.5 rounded-2xl rounded-br-sm text-white shadow-sm ${
        status === 'error' ? 'bg-rose-500' : 'bg-gradient-to-r from-[#A456F7] to-[#3D81F6]'
      } ${status === 'sending' ? 'opacity-70' : ''}`
    : `px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border ${
        status === 'error'
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
      }`;

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <StaticLogo size="sm" />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] min-w-0`}>
        <div className={bubbleClass}>
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Uploaded skin photo ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-40 max-w-[160px] rounded-xl border border-white/20 object-cover"
                />
              ))}
            </div>
          )}
          {/* User text is shown verbatim; the assistant answers in markdown. */}
          {message.content &&
            (isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            ))}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          {time && <span className="text-[10px] text-gray-400 dark:text-slate-500">{time}</span>}
          {status === 'sending' && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">Sending…</span>
          )}
          {status === 'error' && isUser && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="text-[10px] font-medium text-rose-500 hover:text-rose-600 underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

/* ------------------------------------------------------------------ */
/*  Empty state with suggested prompts                                */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "What's a good routine for oily, acne-prone skin?",
  'Recommend a gentle cleanser for sensitive skin',
  'How do I fade acne scars safely?',
  'Which sunscreen works best under makeup?',
];

const EmptyState = ({ onPick, disabled }) => (
  <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center px-6 py-8 gap-6">
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
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="text-left text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_IMAGES = 5;
const NEAR_BOTTOM_PX = 120;

/**
 * Props:
 * - onSend(text, images): async. Resolves once the parent has appended both
 *   the user message and the assistant reply to `initialMessages`.
 * - initialMessages: server-backed history, [{ id, role, content, image, timestamp }]
 * - chatId: id of the chat `initialMessages` belongs to. A brand-new chat has
 *   no id until the first message is sent, so going from undefined -> id is
 *   NOT treated as switching chats.
 * - placeholder: optional input placeholder text
 */
const ChatBox = ({ onSend, initialMessages = [], chatId, placeholder = 'Message Skin Affairs…' }) => {
  const [input, setInput] = useState('');
  // Attached photos as base64 data URLs (up to MAX_IMAGES per message),
  // shown as previews before sending and rendered in the user bubble after.
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  // The message currently in flight, plus how long the history was when it
  // was sent. Rendering it alongside the server history is what makes the
  // send feel instant; `baseCount` is how we know the server history has
  // caught up, so the optimistic copy is dropped without ever showing twice.
  const [outgoing, setOutgoing] = useState(null);
  // Messages that live only on the client: a failed attempt kept on screen
  // with a Retry, or the standalone demo reply. Cleared on the next send.
  const [localMessages, setLocalMessages] = useState([]);

  const textareaRef = useRef(null);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const atBottomRef = useRef(true);
  const prevChatIdRef = useRef(chatId);
  const hasRenderedRef = useRef(false);

  const messages = useMemo(() => {
    const base = localMessages.length ? [...initialMessages, ...localMessages] : initialMessages;
    if (outgoing && initialMessages.length <= outgoing.baseCount) {
      return [...base, ...outgoing.messages];
    }
    return base;
  }, [initialMessages, localMessages, outgoing]);

  // Reset composer state when the user actually switches chats — including
  // to a fresh one via "New Chat" (id -> undefined).
  //
  // The `prev` guard is the important part: a brand-new chat only receives
  // its id once the first message is sent (undefined -> id), and treating
  // that as a switch is what used to wipe the message the user had just
  // typed, mid-request.
  useEffect(() => {
    const prev = prevChatIdRef.current;
    prevChatIdRef.current = chatId;
    if (prev && prev !== chatId) {
      setOutgoing(null);
      setLocalMessages([]);
      setImages([]);
      setImageError('');
      setInput('');
      atBottomRef.current = true;
      hasRenderedRef.current = false;
    }
  }, [chatId]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  // Auto-scroll only when the user is already at the bottom, so reading back
  // through an answer no longer yanks the view down on every update.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!hasRenderedRef.current) {
      // First paint of a chat: jump straight to the latest, no animation.
      hasRenderedRef.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }
    if (atBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      setShowJumpToLatest(true);
    }
  }, [messages, isTyping]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    atBottomRef.current = atBottom;
    setShowJumpToLatest((prev) => (atBottom ? false : prev));
  }, []);

  // Auto-resize the textarea, capped at ~6 lines. Driven by the value rather
  // than the keystroke so clearing or prefilling it resizes correctly too.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Validates selected files (type, size, count) then reads each into a
  // base64 data URL and appends it to the attachments array.
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    // Reset the input so picking the same file twice still fires a change.
    e.target.value = '';
    setImageError('');
    if (!files.length) return;
    if (files.some((f) => !f.type.startsWith('image/'))) {
      setImageError('Please choose only image files.');
      return;
    }
    if (files.some((f) => f.size > MAX_IMAGE_SIZE)) {
      setImageError('Images are too large (max 8MB each).');
      return;
    }
    if (images.length + files.length > MAX_IMAGES) {
      setImageError(`You can attach up to ${MAX_IMAGES} images per message.`);
      return;
    }
    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers)
      .then((results) => setImages((prev) => [...prev, ...results].slice(0, MAX_IMAGES)))
      .catch(() => setImageError('Could not read one of those images. Try again.'));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageError('');
  };

  const deliver = useCallback(
    async (text, attachments) => {
      const baseCount = initialMessages.length;
      const userMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: text,
        image: attachments,
        timestamp: Date.now(),
        status: 'sending',
      };

      setLocalMessages([]);
      setOutgoing({ baseCount, messages: [userMessage] });
      setIsTyping(true);
      atBottomRef.current = true;

      try {
        if (onSend) {
          // The parent appends both messages to `initialMessages`; by the time
          // this resolves the history already has them, so dropping the
          // optimistic copy here never leaves a gap.
          await onSend(text, attachments.length ? attachments : undefined);
          setOutgoing(null);
        } else {
          // Standalone demo fallback when no backend is wired up.
          const reply = await new Promise((resolve) =>
            setTimeout(
              () => resolve("Thanks for your question — connect this component's onSend prop to your backend to get real answers here."),
              900
            )
          );
          setOutgoing(null);
          setLocalMessages([
            { ...userMessage, status: 'sent' },
            { id: `demo-${Date.now()}`, role: 'assistant', content: reply, timestamp: Date.now() },
          ]);
        }
      } catch (err) {
        setOutgoing(null);
        setLocalMessages([
          { ...userMessage, status: 'error' },
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            // Surface what actually went wrong (out of credits, network, …)
            // instead of a catch-all that tells the user nothing.
            content: err?.message || 'Something went wrong sending that. Please try again.',
            timestamp: Date.now(),
            status: 'error',
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [initialMessages.length, onSend]
  );

  const handleSend = useCallback(
    (overrideText) => {
      const text = (overrideText ?? input).trim();
      const attachments = [...images];
      // A message can be sent with text, photos, or both — but never while
      // a request is already in flight, and never over the image cap.
      if ((!text && !attachments.length) || isTyping) return;
      if (attachments.length > MAX_IMAGES) {
        setImageError(`You can attach up to ${MAX_IMAGES} images per message.`);
        return;
      }
      setInput('');
      setImages([]);
      setImageError('');
      deliver(text, attachments);
    },
    [input, images, isTyping, deliver]
  );

  const handleRetry = useCallback(
    (message) => {
      if (isTyping) return;
      const attachments = Array.isArray(message.image) ? message.image : [];
      deliver(message.content, attachments);
    },
    [isTyping, deliver]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (input.trim().length > 0 || images.length > 0) && !isTyping;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pl-14 md:pl-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <AnimatedLogo size="sm" active={isTyping} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Skin Affairs</span>
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isTyping ? 'Thinking…' : 'Online'}
          </span>
        </div>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyState onPick={(s) => handleSend(s)} disabled={isTyping} />
      ) : (
        <div className="relative flex-1 min-h-0">
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto overscroll-contain px-4 py-4 space-y-4 chat-scroll"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} onRetry={handleRetry} />
            ))}
            {isTyping && (
              <div className="flex items-end gap-2">
                <StaticLogo size="sm" />
                <TypingIndicator />
              </div>
            )}
          </div>

          {showJumpToLatest && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowDownIcon className="w-3.5 h-3.5" />
              Jump to latest
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        {images.length > 0 && (
          <div className="mb-2 ml-1 flex flex-wrap items-center gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt={`Attachment preview ${i + 1}`}
                  className="h-16 w-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={`Remove image ${i + 1}`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              {images.length}/{MAX_IMAGES} attached for skin analysis
            </span>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition-shadow">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping || images.length >= MAX_IMAGES}
            aria-label="Attach image"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-label="Message"
            className="flex-1 min-w-0 resize-none bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none max-h-40 chat-scroll"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!canSend}
            aria-label="Send message"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
          >
            {isTyping ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        {imageError && <p className="mt-1 px-1 text-[11px] text-rose-500">{imageError}</p>}
        <p className="mt-1.5 px-1 text-[11px] text-gray-400 dark:text-slate-500">
          Enter to send • Shift+Enter for a new line • Attach up to {MAX_IMAGES} photos for skin analysis
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
