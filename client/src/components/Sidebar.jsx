import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

export const SkinAffairsLogo = ({ isCollapsed }) => {
  return (
    <div className={`flex items-center gap-4 p-2 select-none ${isCollapsed ? 'justify-center' : ''}`}>
      {/* Animated Avatar Container */}
      <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center">
        {/* Glowing Background Pulse */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 rounded-full animate-pulse blur-md opacity-40"></div>

        {/* Main Avatar Canvas */}
        <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-1 shadow-xl border border-purple-500/30 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="maskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="towelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>

              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="100%" stopColor="#FDBA74" />
              </linearGradient>
            </defs>

            <path d="M35 75 Q50 82 65 75 L70 100 L30 100 Z" fill="#FDBA74" />
            <path d="M25 82 Q50 95 75 82 L80 100 L20 100 Z" fill="url(#towelGrad)" />
            <ellipse cx="50" cy="58" rx="18" ry="22" fill="url(#skinGrad)" />
            <path d="M33 52 Q50 42 67 52 Q68 68 50 76 Q32 68 33 52 Z" fill="url(#maskGrad)" opacity="0.9" />
            <path d="M40 56 Q44 60 47 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M53 56 Q56 60 60 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M45 68 Q50 72 55 68" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M30 45 Q50 35 70 45 Q75 35 65 25 Q50 15 35 25 Q25 35 30 45 Z" fill="url(#towelGrad)" />
            <path d="M42 28 Q50 10 58 28 Q50 22 42 28 Z" fill="#F1F5F9" />
            <path d="M36 34 Q50 26 64 34" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
            <path d="M40 28 Q50 20 60 28" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />

            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
              <circle cx="28" cy="28" r="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1" />
              <circle cx="28" cy="28" r="2" fill="#34D399" />
            </g>

            <g className="animate-pulse">
              <path d="M72 32 L74 36 L78 38 L74 40 L72 44 L70 40 L66 38 L70 36 Z" fill="#FDE047" />
            </g>
          </svg>
        </div>
      </div>

      {/* Brand Name Header */}
      {!isCollapsed && (
        <div className="flex flex-col">
          <h1
            className="text-3xl text-gray-900 dark:text-white leading-tight"
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

const Sidebar = () => {
  const { chats, setSelectedChat, theme, setTheme, user, navigate, newChat, deleteChat, logout } = useAppContext();
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <>
      {/* Scoped thin scrollbar for the Recent Chats list only.
          Doesn't touch any other scrollbar in the app. */}
      <style>{`
        .recent-chats-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .recent-chats-scroll::-webkit-scrollbar-thumb {
          background: #a0aec0;
          border-radius: 10px;
        }
        .recent-chats-scroll::-webkit-scrollbar-thumb:hover {
          background: #8b96a8;
        }
        .recent-chats-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .recent-chats-scroll {
          scrollbar-width: thin;
          scrollbar-color: #a0aec0 transparent;
        }
      `}</style>

      {/* Universal Floating Menu Button */}
      {!isMenuOpen && (
        <button
          onClick={() => setIsMenuOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-lg hover:scale-105 transition-all"
          title="Open Sidebar"
        >
          <img
            src={assets.menu_icon}
            className="w-5 h-5 not-dark:invert"
            alt="Open Menu"
          />
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative top-0 left-0 z-40 h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isMenuOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:p-0 md:overflow-hidden md:border-none'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto recent-chats-scroll">
          {/* Header Row with Logo and Close Toggle */}
          <div className="flex items-center justify-between">
            <SkinAffairsLogo />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Close Sidebar"
            >
              <img
                src={assets.close_icon}
                className="w-5 h-5 cursor-pointer not-dark:invert"
                alt="Close Menu"
              />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              newChat && newChat();
              setIsMenuOpen(false);
            }}
            className="flex justify-center items-center w-full py-2 mt-4 text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <span className="mr-2 text-xl">+</span> New Chat
          </button>

          {/* Search Bar */}
          <div className="mt-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Recent Chats Section */}
          {/* min-h-[220px] is the key fix: on short screens, flex-1 alone can
              squeeze this section down to almost nothing once every other
              fixed-height block (logo, search, dark mode, credits,
              community, account) claims its space. The floor guarantees
              roughly 4 chats stay visible; the outer aside above now also
              scrolls as a fallback if content still doesn't fit. */}
          <div className="flex-1 flex flex-col min-h-[220px] mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 flex-shrink-0">
              Recent Chats
            </p>

            <div className="recent-chats-scroll flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {chats && chats.length > 0 ? (
                chats
                  .filter((chat) => {
                    const content = chat.messages?.[0]?.content || chat.name || '';
                    return content.toLowerCase().includes(search.toLowerCase());
                  })
                  .map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => {
                        setSelectedChat && setSelectedChat(chat);
                        setIsMenuOpen(false); // Closes sidebar on chat click
                      }}
                      className="p-2 px-3 dark:bg-[#57317C]/10 border border-gray-300 dark:border-[#80609F]/15 rounded-md cursor-pointer flex justify-between items-center group hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="overflow-hidden mr-2">
                        <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                          {chat.messages?.length > 0 ? chat.messages[0].content.slice(0, 32) : (chat.name || 'New Chat')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#B1A6C0]">
                          {chat.updatedAt || 'Just now'}
                        </p>
                      </div>
                      <img
                        src={assets.bin_icon}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteChat) deleteChat(chat._id);
                        }}
                        className="hidden group-hover:block w-4 h-4 cursor-pointer not-dark:invert flex-shrink-0"
                        alt="Delete"
                      />
                    </div>
                  ))
              ) : (
                <p className="text-xs text-gray-400 italic">No recent chats found</p>
              )}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md flex-shrink-0 bg-white dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm">
              <img src={assets.theme_icon} className="w-4 not-dark:invert" alt="" />
              <p className="text-gray-800 dark:text-gray-200">Dark Mode</p>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input
                onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                type="checkbox"
                className="sr-only peer"
                checked={theme === 'dark'}
              />
              <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition-all"></div>
              <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
            </label>
          </div>

          {/* Credit Purchases Option */}
          <div
            onClick={() => {
              navigate('/credits');
              setIsMenuOpen(false); // Closes sidebar on Credits click
            }}
            className="flex items-center gap-2 p-3 mt-2 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer hover:scale-[1.02] transition-all flex-shrink-0 bg-white dark:bg-slate-800/50"
          >
            <img src={assets.diamond_icon} className="w-4.5 not-dark:invert" alt="" />
            <div className="flex flex-col text-sm">
              <p className="text-gray-800 dark:text-gray-200 font-medium">Credits : {user?.credits}</p>
              <p className="text-xs text-gray-400">Purchase credits to use SkinAffairs</p>
            </div>
          </div>

          {/* Community Images */}
          <div
            onClick={() => {
              navigate && navigate('/community');
              setIsMenuOpen(false); // Closes sidebar on Community Images click
            }}
            className="flex items-center gap-2 p-3 mt-2 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer hover:scale-[1.02] transition-all flex-shrink-0 bg-white dark:bg-slate-800/50"
          >
            <img src={assets.gallery_icon} className="w-4.5 not-dark:invert" alt="" />
            <div className="flex flex-col text-sm">
              <p className="text-gray-800 dark:text-gray-200 font-medium">Community Images</p>
            </div>
          </div>

          {/* User Account */}
          <div className="flex items-center gap-3 p-3 mt-2 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer group flex-shrink-0 bg-white dark:bg-slate-800/50">
            <img src={assets.user_icon} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
            <p className="flex-1 text-sm dark:text-primary truncate text-gray-800 dark:text-gray-200">
              {user ? user.name : 'Login your account'}
            </p>
            {user && (
              <img
                src={assets.logout_icon}
                onClick={() => logout && logout()}
                className="h-5 w-5 cursor-pointer hidden not-dark:invert group-hover:block flex-shrink-0"
                alt="Logout"
              />
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop Overlay for Mobile Screen Sizes */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;