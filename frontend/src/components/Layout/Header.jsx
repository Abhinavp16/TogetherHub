import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Settings, Bell, Sparkles, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import UserPresence from '../Collaboration/UserPresence'
import ThemeToggle from '../UI/ThemeToggle'
import SettingsPanel from '../UI/SettingsPanel'
import SearchModal from '../UI/SearchModal'
import Logo from '../UI/Logo'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'

const Header = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    openSettings: () => setIsSettingsOpen(true),
    openSearch: () => setIsSearchOpen(true),
    closeModals: () => {
      setIsSettingsOpen(false)
      setIsSearchOpen(false)
    }
  })

  return (
    <>
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      <header className="glass-header sticky top-0 z-50">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="group">
              <Logo 
                size="medium" 
                showText={true} 
                className="group-hover:scale-105 transition-transform duration-300" 
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserPresence />
            
            {/* Search Button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-3 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 relative group hover:scale-105 hover:shadow-lg"
              title="Search (Ctrl+K)"
            >
              <Search size={20} />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </button>
            
            <button className="p-3 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 relative group hover:scale-105 hover:shadow-lg">
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </button>
            
            <ThemeToggle />
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 relative group hover:scale-105 hover:shadow-lg"
              title="Settings (Ctrl+,)"
            >
              <Settings size={20} />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </button>
            
            <div className="relative">
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 glass-card px-4 py-2 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <img 
                  src={user?.avatar} 
                  alt={user?.name}
                  className="w-10 h-10 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-gradient transition-all duration-300">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}

export default Header