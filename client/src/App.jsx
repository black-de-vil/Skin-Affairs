import React, { useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'
import Credits from './pages/Credits'
import Community from './pages/Community'
import Auth from './pages/Auth'
import { Routes, Route } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import { assets } from './assets/assets'

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading, selectedChat, sendMessage } = useAppContext()

  // Normalise stored chat messages (including any attached skin photos)
  // into the shape ChatBox expects.
  const initialMessages = useMemo(
    () =>
      (selectedChat?.messages || []).map((m, i) => ({
        id: m._id || `${m.role}-${m.timestamp}-${i}`,
        role: m.role,
        content: m.content,
        image: m.image || [],
        timestamp: m.timestamp,
      })),
    [selectedChat]
  )

  if (loading) {
    return (
      <div className='w-screen h-screen flex items-center justify-center bg-gradient-to-b from-[#242124] to-[#000000]'>
        <div className='w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin' />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className='dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white'>
      {!isMenuOpen && (
        <img 
          src={assets.menu_icon} 
          className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert z-20' 
          onClick={() => setIsMenuOpen(true)} 
          alt="Open Menu" 
        />
      )}
      <div className='flex h-screen w-screen'>
        <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <Routes>
          <Route
            path='/'
            element={
              <ChatBox
                key={selectedChat?._id || 'new'}
                initialMessages={initialMessages}
                onSend={sendMessage}
              />
            }
          />
          <Route path='/credits' element={<Credits />} />
          <Route path='/community' element={<Community />} />
        </Routes>
      </div>
    </div>
  )
}

export default App