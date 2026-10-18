import { useId, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

/* ------------------------------------------------------------------ */
/*  Relative timestamps — chats used to render the raw Mongo ISO       */
/*  string ("2025-10-03T12:04:33.123Z") straight into the list.        */
/* ------------------------------------------------------------------ */

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'Just now';

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const chatTitle = (chat) => {
  const first = chat.messages?.find((m) => m.role === 'user' && m.content?.trim());
  if (first) return first.content.trim().slice(0, 40);
  if (chat.messages?.length) return 'Photo analysis';
  return chat.name || 'New Chat';
};

/* ------------------------------------------------------------------ */
/*  Brand mark                                                         */
/* ------------------------------------------------------------------ */

export const SkinAffairsLogo = ({ isCollapsed }) => {
  // Unique gradient ids — hardcoded ids collide whenever the mark is
  // rendered more than once on a page and the fills go wrong.
  const uid = useId();

  return (
    <div className={`flex items-center gap-3 p-1.5 sm:p-2 select-none ${isCollapsed ? 'justify-center' : ''}`}>
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 rounded-full motion-safe:animate-pulse blur-md opacity-40" />

        <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-1 shadow-xl border border-purple-500/30 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" aria-hidden="true">
            <defs>
              <linearGradient id={`sb-mask-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id={`sb-towel-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id={`sb-skin-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="100%" stopColor="#FDBA74" />
              </linearGradient>
            </defs>

            <path d="M35 75 Q50 82 65 75 L70 100 L30 100 Z" fill="#FDBA74" />
            <path d="M25 82 Q50 95 75 82 L80 100 L20 100 Z" fill={`url(#sb-towel-${uid})`} />
            <ellipse cx="50" cy="58" rx="18" ry="22" fill={`url(#sb-skin-${uid})`} />
            <path d="M33 52 Q50 42 67 52 Q68 68 50 76 Q32 68 33 52 Z" fill={`url(#sb-mask-${uid})`} opacity="0.9" />
            <path d="M40 56 Q44 60 47 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M53 56 Q56 60 60 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M45 68 Q50 72 55 68" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M30 45 Q50 35 70 45 Q75 35 65 25 Q50 15 35 25 Q25 35 30 45 Z" fill={`url(#sb-towel-${uid})`} />
            <path d="M42 28 Q50 10 58 28 Q50 22 42 28 Z" fill="#F1F5F9" />
            <path d="M36 34 Q50 26 64 34" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
            <path d="M40 28 Q50 20 60 28" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />

            <g className="motion-safe:animate-bounce" style={{ animationDuration: '3s' }}>
              <circle cx="28" cy="28" r="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
              <circle cx="28" cy="28" r="2" fill="#34D399" />
            </g>

            <g className="motion-safe:animate-pulse">
              <path d="M72 32 L74 36 L78 38 L74 40 L72 44 L70 40 L66 38 L70 36 Z" fill="#FDE047" />
            </g>
          </svg>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col min-w-0">
          <h1
            className="text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight truncate"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Skin Affairs
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-emerald-500 dark:text-emerald-400 uppercase">
            Intelligent AI Assistant
          </p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/*                                                                     */
/*  Open/closed state is owned by App and passed in. It used to keep a  */
/*  second copy of that state locally, so App's menu button toggled     */
/*  nothing and two menu buttons sat on top of each other.              */
/* ------------------------------------------------------------------ */

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const { chats, selectedChat, setSelectedChat, theme, setTheme, user, navigate, newChat, deleteChat, logout } =
    useAppContext();
  const [search, setSearch] = useState('');
  // id of the chat whose delete button is armed, if any
  const [pendingDelete, setPendingDelete] = useState(null);

  // Closing on navigation only makes sense on phones, where the sidebar is
  // an overlay. On desktop it just made the sidebar vanish on every click.
  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches) {
      setIsMenuOpen(false);
    }
  };

  // Opening a chat has to return to the chat route — picking one while on
  // Credits or Community used to change the selection and go nowhere.
  const openChat = (chat) => {
    setPendingDelete(null);
    setSelectedChat(chat);
    navigate('/');
    closeOnMobile();
  };

  // Search across the whole conversation, not just its first message.
  const visibleChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats || [];
    return (chats || []).filter((chat) => {
      if ((chat.name || '').toLowerCase().includes(query)) return true;
      return (chat.messages || []).some((m) => (m.content || '').toLowerCase().includes(query));
    });
  }, [chats, search]);

  return (
    <>
      {/* Floating open button — phones only. On desktop the collapsed rail
          below carries its own button, so nothing overlaps the page content. */}
      {!isMenuOpen && (
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-lg active:scale-95 transition-transform"
          aria-label="Open sidebar"
          title="Open Sidebar"
        >
          <img src={assets.menu_icon} className="w-5 h-5 not-dark:invert" alt="" />
        </button>
      )}

      {/* No aria-hidden here: when collapsed on desktop this still renders a
          visible, focusable toggle, and hiding its container from assistive
          tech while it can take focus is exactly what browsers now block.
          Closed-on-mobile content is display:none, so it is ignored anyway. */}
      <aside
        className={`fixed md:relative top-0 left-0 z-40 h-dvh bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-[width,transform] duration-300 ease-in-out ${
          isMenuOpen ? 'w-72 max-w-[85vw] translate-x-0 p-3 sm:p-4' : '-translate-x-full md:translate-x-0 w-0 md:w-14 p-0 overflow-hidden'
        }`}
      >
        {isMenuOpen ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Header Row with Logo and Close Toggle */}
            <div className="flex items-center justify-between gap-2 flex-shrink-0">
              <SkinAffairsLogo />
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close sidebar"
                title="Close Sidebar"
              >
                <img src={assets.close_icon} className="w-5 h-5 not-dark:invert" alt="" />
              </button>
            </div>

            {/* New Chat */}
            <button
              type="button"
              onClick={() => {
                newChat();
                closeOnMobile();
              }}
              className="flex justify-center items-center w-full py-2.5 mt-3 sm:mt-4 text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer flex-shrink-0 hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <span className="mr-2 text-xl leading-none">+</span> New Chat
            </button>

            {/* Search */}
            <div className="mt-3 sm:mt-4 flex-shrink-0">
              <input
                type="search"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPendingDelete(null);
                }}
                aria-label="Search chats"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Recent chats */}
            {/* The only part of the sidebar that flexes. Everything around it
                is now compact enough that this keeps a usable height even on
                a short phone viewport — and because it shrinks rather than
                overflowing, the account row below always stays on screen. */}
            <div className="flex-1 flex flex-col min-h-0 mt-3 sm:mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 flex-shrink-0">Recent Chats</p>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-1 chat-scroll">
                {visibleChats.length > 0 ? (
                  visibleChats.map((chat) => {
                    const isActive = String(selectedChat?._id) === String(chat._id);
                    return (
                      <div
                        key={chat._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openChat(chat)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openChat(chat);
                          }
                        }}
                        className={`p-2 px-3 border rounded-md cursor-pointer flex justify-between items-center gap-2 group transition-colors ${
                          isActive
                            ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-[#57317C]/30'
                            : 'border-gray-300 dark:border-[#80609F]/15 dark:bg-[#57317C]/10 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="overflow-hidden min-w-0">
                          <p className="truncate text-sm text-gray-800 dark:text-gray-200">{chatTitle(chat)}</p>
                          <p className="text-xs text-gray-500 dark:text-[#B1A6C0]">
                            {formatRelativeTime(chat.updatedAt)}
                          </p>
                        </div>
                        {/* Two-step delete. The bin is always visible on touch
                            (there is no hover to reveal it there), and deleting
                            a chat cannot be undone — so the first tap only arms
                            it and the second confirms. */}
                        {pendingDelete === chat._id ? (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete(null);
                                deleteChat(chat._id);
                              }}
                              aria-label={`Confirm deleting chat: ${chatTitle(chat)}`}
                              className="px-2 py-1 rounded text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete(null);
                              }}
                              aria-label="Cancel delete"
                              className="px-2 py-1 rounded text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-slate-300/50 dark:hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(chat._id);
                            }}
                            aria-label={`Delete chat: ${chatTitle(chat)}`}
                            className="p-2 -m-1 rounded hover:bg-slate-300/50 dark:hover:bg-slate-700 transition-opacity flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                          >
                            <img src={assets.bin_icon} className="w-4 h-4 not-dark:invert" alt="" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {search ? 'No chats match that search' : 'No recent chats found'}
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions — theme, credits and community used to be three
                stacked full-width rows (~190px). On a phone that pushed the
                account row below the fold and forced the whole sidebar to
                scroll. One row of three keeps all of it in view. */}
            <div className="grid grid-cols-3 gap-2 mt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-pressed={theme === 'dark'}
                title="Toggle dark mode"
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              >
                <img src={assets.theme_icon} className="w-4 h-4 not-dark:invert" alt="" />
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 capitalize">{theme}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/credits');
                  closeOnMobile();
                }}
                title={`${user?.credits ?? 0} credits — tap to buy more`}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              >
                <img src={assets.diamond_icon} className="w-4 h-4 not-dark:invert" alt="" />
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                  {user?.credits ?? 0} credits
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/community');
                  closeOnMobile();
                }}
                title="Community images"
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              >
                <img src={assets.gallery_icon} className="w-4 h-4 not-dark:invert" alt="" />
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Community</span>
              </button>
            </div>

            {/* Account */}
            <div className="flex items-center gap-3 p-3 mt-2 border border-gray-300 dark:border-white/15 rounded-md group flex-shrink-0 bg-white dark:bg-slate-800/50">
              <img src={assets.user_icon} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
              <p className="flex-1 text-sm truncate text-gray-800 dark:text-gray-200">
                {user ? user.name : 'Login your account'}
              </p>
              {user && (
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Log out"
                  title="Log out"
                  className="p-2 -m-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                >
                  <img src={assets.logout_icon} className="h-5 w-5 not-dark:invert" alt="" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed desktop rail — keeps the toggle inside the layout so it
             never covers the page heading underneath. */
          <div className="hidden md:flex flex-col items-center w-14 pt-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open sidebar"
              title="Open Sidebar"
            >
              <img src={assets.menu_icon} className="w-5 h-5 not-dark:invert" alt="" />
            </button>
          </div>
        )}
      </aside>

      {/* Backdrop — phones only */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;