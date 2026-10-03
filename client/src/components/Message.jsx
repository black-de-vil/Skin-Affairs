import { useState, useEffect } from 'react';
import Markdown from './Markdown';

/* ------------------------------------------------------------------ */
/*  Inline icons — no extra icon library dependency required          */
/* ------------------------------------------------------------------ */

const CopyIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const RegenerateIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 9a8 8 0 0 1 14-4M19.5 15a8 8 0 0 1-14 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ThumbsUpIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7 10v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm0 0 4.5-7a2 2 0 0 1 3.6 1.5L14 9h4.6a2 2 0 0 1 1.94 2.5l-1.7 7A2 2 0 0 1 16.9 20H10a3 3 0 0 1-3-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const ThumbsDownIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M17 14V4h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3Zm0 0-4.5 7a2 2 0 0 1-3.6-1.5L10 15H5.4a2 2 0 0 1-1.94-2.5l1.7-7A2 2 0 0 1 7.1 4H14a3 3 0 0 1 3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Default avatars — swap these out via the `avatar` / `userAvatar`  */
/*  props (e.g. pass your AnimatedLogo from ChatBox.jsx here)         */
/* ------------------------------------------------------------------ */

const DefaultAssistantAvatar = () => (
  <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 flex items-center justify-center shadow-sm">
    <svg viewBox="0 0 100 100" className="w-5 h-5">
      <ellipse cx="50" cy="58" rx="18" ry="22" fill="#FDBA74" />
      <path d="M33 52 Q50 42 67 52 Q68 68 50 76 Q32 68 33 52 Z" fill="#34D399" opacity="0.9" />
    </svg>
  </div>
);

const DefaultUserAvatar = ({ name }) => (
  <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-r from-[#A456F7] to-[#3D81F6] flex items-center justify-center text-white text-xs font-semibold shadow-sm">
    {(name || 'U').trim().charAt(0).toUpperCase()}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Message                                                            */
/* ------------------------------------------------------------------ */

/**
 * Props:
 * - message: { id, role: 'user'|'assistant', content, timestamp, status }
 *     status: 'sent' (default) | 'sending' | 'streaming' | 'error'
 * - avatar: optional ReactNode to replace the default assistant avatar
 *     (pass your AnimatedLogo from ChatBox.jsx for full brand consistency)
 * - userAvatar: optional ReactNode to replace the default user avatar
 * - userName / assistantName: display names, used for the default avatar initial
 * - onCopy(content): optional override for the copy action
 * - onRegenerate(id): if provided, shows a regenerate button on assistant messages
 * - onFeedback(id, 'up' | 'down'): if provided, shows thumbs up/down on assistant messages
 * - onEdit(id): if provided, shows an edit button on user messages
 * - onRetry(id): called when the user retries a message with status 'error'
 */
const Message = ({
  message,
  avatar,
  userAvatar,
  userName = 'You',
  onCopy,
  onRegenerate,
  onFeedback,
  onEdit,
  onRetry,
}) => {
  const { id, role, content, timestamp, status = 'sent' } = message;
  const isUser = role === 'user';

  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Subtle entrance — only for messages that just arrived, driven by user action
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleCopy = async () => {
    if (onCopy) return onCopy(content);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const handleFeedback = (value) => {
    setFeedback((prev) => (prev === value ? null : value));
    onFeedback && onFeedback(id, value);
  };

  const bubbleClass = isUser
    ? `px-4 py-2.5 rounded-2xl rounded-br-sm text-white shadow-sm ${
        status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-[#A456F7] to-[#3D81F6]'
      } ${status === 'sending' ? 'opacity-60' : ''}`
    : `px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border ${
        status === 'error'
          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
      }`;

  return (
    <div
      className={`group flex items-end gap-2 transition-all duration-300 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {isUser ? userAvatar ?? <DefaultUserAvatar name={userName} /> : avatar ?? <DefaultAssistantAvatar />}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
        <div className={bubbleClass}>
          <Markdown content={content} />
          {status === 'streaming' && (
            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current align-text-bottom animate-pulse" />
          )}
        </div>

        {/* Timestamp / error retry */}
        <div className="flex items-center gap-2 mt-1 px-1">
          {time && <span className="text-[10px] text-gray-400 dark:text-slate-500">{time}</span>}
          {status === 'error' && (
            <button
              onClick={() => onRetry && onRetry(id)}
              className="text-[10px] font-medium text-red-500 hover:text-red-600 underline underline-offset-2"
            >
              Failed — retry
            </button>
          )}
        </div>

        {/* Hover action bar */}
        {status !== 'sending' && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            </button>

            {isUser && onEdit && (
              <button
                onClick={() => onEdit(id)}
                aria-label="Edit message"
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <EditIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && onRegenerate && (
              <button
                onClick={() => onRegenerate(id)}
                aria-label="Regenerate response"
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <RegenerateIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && onFeedback && (
              <>
                <button
                  onClick={() => handleFeedback('up')}
                  aria-label="Good response"
                  className={`p-1 rounded transition-colors ${
                    feedback === 'up' ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  <ThumbsUpIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  aria-label="Poor response"
                  className={`p-1 rounded transition-colors ${
                    feedback === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  <ThumbsDownIcon className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;