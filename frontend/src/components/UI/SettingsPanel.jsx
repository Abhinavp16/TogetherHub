import { useState } from 'react'
import { X, User, Bell, Palette, Globe, Shield, HelpCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'

const SettingsPanel = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme()
  const { success } = useNotifications()
  const [activeTab, setActiveTab] = useState('appearance')
  const [settings, setSettings] = useState({
    notifications: {
      desktop: true,
      sound: false,
      email: true,
      collaboration: true
    },
    appearance: {
      theme: theme,
      fontSize: 'medium',
      animations: true
    },
    privacy: {
      showOnlineStatus: true,
      shareTypingIndicator: true,
      allowDirectMessages: true
    }
  })

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ]

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    success('Settings updated successfully')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-slate-700/30">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-slate-800/20 rounded-xl transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/20 dark:border-slate-700/30 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-modern">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Appearance Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme
                    </label>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          if (theme !== 'light') toggleTheme()
                          handleSettingChange('appearance', 'theme', 'light')
                        }}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          theme === 'light'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => {
                          if (theme !== 'dark') toggleTheme()
                          handleSettingChange('appearance', 'theme', 'dark')
                        }}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Font Size
                    </label>
                    <select
                      value={settings.appearance.fontSize}
                      onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                      className="select-modern"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Enable Animations
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Smooth transitions and effects
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.animations}
                        onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notification Settings</h3>
                
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()} Notifications
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {key === 'desktop' && 'Show desktop notifications'}
                          {key === 'sound' && 'Play notification sounds'}
                          {key === 'email' && 'Send email notifications'}
                          {key === 'collaboration' && 'Notify about collaboration events'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Privacy Settings</h3>
                
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {key === 'showOnlineStatus' && 'Let others see when you\'re online'}
                          {key === 'shareTypingIndicator' && 'Show typing indicator to others'}
                          {key === 'allowDirectMessages' && 'Allow direct messages from other users'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Account Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="label-modern">Display Name</label>
                    <input
                      type="text"
                      defaultValue="Abhinav Pandey"
                      className="input-modern"
                    />
                  </div>
                  
                  <div>
                    <label className="label-modern">Email</label>
                    <input
                      type="email"
                      defaultValue="abhinav@example.com"
                      className="input-modern"
                    />
                  </div>
                  
                  <div>
                    <label className="label-modern">Bio</label>
                    <textarea
                      defaultValue="MCA Student at Amity University Chhattisgarh"
                      className="input-modern h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Help & Support</h3>
                
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Keyboard Shortcuts</h4>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Toggle Theme</span>
                        <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Ctrl + Shift + T</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>New Room</span>
                        <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Ctrl + N</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Settings</span>
                        <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Ctrl + ,</kbd>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">About Together Hub</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Version 1.0.0 - Together Hub: Real-time collaboration platform built with React.js
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Developed by Abhinav Pandey - MCA 3rd Sem, Amity University Chhattisgarh
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel