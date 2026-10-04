import { useState, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'
import Credits from './pages/Credits'
import Community from './pages/Community'
import Auth from './pages/Auth'
import { useAppContext } from './context/AppContext'

// Desktop starts with the sidebar open; phones start closed so the chat is
// usable immediately instead of being hidden behind the menu and its backdrop.
const prefersOpenSidebar = () =>
  typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(prefersOpenSidebar)
  const { user, loading, selectedChat, sendMessage } = useAppContext()

  // Normalise stored chat messages (including any attached skin photos)
  // into the shape ChatBox expects. Keyed off the messages array rather than
  // the chat object so a background refetch that returns identical messages
  // doesn't churn the whole list.
  const messages = selectedChat?.messages
  const initialMessages = useMemo(
    () =>
      (messages || []).map((m, i) => ({
        id: m._id || `${m.role}-${m.timestamp}-${i}`,
        role: m.role,
        content: m.content,
        image: m.image || [],
        timestamp: m.timestamp,
      })),
    [messages]
  )

  // prefersOpenSidebar only ran at mount, so rotating a tablet or resizing a
  // window left the sidebar in the wrong state — open and covering the chat
  // on a narrow screen, or closed with no visible way back on a wide one.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const onChange = (event) => setIsMenuOpen(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  if (loading) {
    return (
      <div className='w-full h-dvh flex items-center justify-center bg-gradient-to-b from-[#242124] to-[#000000]'>
        <div className='w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full motion-safe:animate-spin' />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className='flex h-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950 dark:text-white'>
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Routes>
        <Route
          path='/'
          element={
            // No `key` here on purpose: a brand-new chat receives its id the
            // moment the first message is sent, and keying on that id made
            // React throw ChatBox away mid-request — which is what looked
            // like the page refreshing on the first message.
            <ChatBox
              chatId={selectedChat?._id}
              initialMessages={initialMessages}
              onSend={sendMessage}
            />
          }
        />
        <Route path='/credits' element={<Credits />} />
        <Route path='/community' element={<Community />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </div>
  )
}

export default App
