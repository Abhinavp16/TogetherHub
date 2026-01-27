import { Link } from 'react-router-dom'
import { FileText, Code, PenTool, Users, Plus, Sparkles, Zap, Clock, TrendingUp, Bell, ArrowRight, Star, Activity } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { useState, useEffect } from 'react'
import { documentAPI } from '../services/api'
import toast from 'react-hot-toast'

const Home = () => {
  const { success, error, warning, info } = useNotifications()
  const collaborationTools = [
    {
      title: 'Document Editor',
      description: 'Collaborative rich text editing with real-time sync and version control',
      icon: FileText,
      path: '/document/new',
      gradient: 'from-blue-500 to-indigo-600',
      stats: '12 active docs',
      bgPattern: 'bg-blue-50/50 dark:bg-blue-900/20',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
      features: ['Real-time sync', 'Version history', 'Comments']
    },
    {
      title: 'Code Editor',
      description: 'Multi-language code editing with Monaco Editor and live collaboration',
      icon: Code,
      path: '/code/new',
      gradient: 'from-green-500 to-emerald-600',
      stats: '8 projects',
      bgPattern: 'bg-green-50/50 dark:bg-green-900/20',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
      features: ['Syntax highlighting', 'Auto-complete', 'Live sharing']
    },
    {
      title: 'Whiteboard',
      description: 'Visual collaboration with advanced drawing tools and templates',
      icon: PenTool,
      path: '/whiteboard/new',
      gradient: 'from-purple-500 to-pink-600',
      stats: '5 boards',
      bgPattern: 'bg-purple-50/50 dark:bg-purple-900/20',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-700',
      features: ['Drawing tools', 'Templates', 'Export options']
    }
  ]

  const [recentRooms, setRecentRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await documentAPI.getDocuments()
        // Map documents to common room format
        const docs = response.data.slice(0, 3).map(doc => ({
          id: doc._id,
          title: doc.title,
          type: doc.type,
          icon: doc.type === 'code' ? Code : doc.type === 'whiteboard' ? PenTool : FileText,
          lastEdited: new Date(doc.updatedAt).toLocaleDateString(),
          collaborators: (doc.collaborators?.length || 0) + 1,
          gradient: doc.type === 'code' ? 'from-green-500 to-emerald-500' : doc.type === 'whiteboard' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-indigo-500'
        }))
        setRecentRooms(docs)
      } catch (error) {
        // Silent error for home page recent rooms
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="text-center mb-8 relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl animate-gradient-x"></div>
        <div className="relative">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-4 shadow-lg transition-all duration-700 hover:from-blue-500/20 hover:via-purple-500/20 hover:to-pink-500/20 animate-gradient-x">
            <Sparkles className="text-blue-600 animate-pulse" size={14} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Real Time Collaboration Platform</span>
            <Star className="text-yellow-500 animate-spin" size={12} style={{ animationDuration: '3s' }} />
          </div>

          {/* Original Together Hub Logo for Hero */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-x"></div>
              <img
                src="/together-hub-logo.jpeg"
                alt="Together Hub Logo"
                className="relative w-20 h-20 object-contain rounded-2xl shadow-lg transition-all duration-500"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 tracking-tight animate-gradient-x">
            Together Hub
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
            Collaborate seamlessly with documents, code, and whiteboards in real-time.
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold animate-gradient-x"> Built for teams that move fast.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <div className="flex items-center space-x-1 glass-card px-3 py-1 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-500">
              <Activity className="text-green-500" size={12} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Live Collaboration</span>
            </div>
            <div className="flex items-center space-x-1 glass-card px-3 py-1 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 transition-all duration-500">
              <Zap className="text-yellow-500" size={12} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Real-time Sync</span>
            </div>
            <div className="flex items-center space-x-1 glass-card px-3 py-1 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-500">
              <Star className="text-purple-500" size={12} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Professional Tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {collaborationTools.map((tool, index) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.title}
              to={tool.path}
              className="group relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-all duration-700 rounded-xl animate-gradient-xy`}></div>
              <div className="relative glass-card p-4 transition-all duration-500 border border-transparent group-hover:border-white/30 rounded-xl group-hover:shadow-lg">
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tool.gradient} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:bg-gradient-to-tl animate-gradient-xy`}>
                    <Icon size={20} />
                  </div>

                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 transition-all duration-500">
                      {tool.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed text-sm transition-colors duration-300">
                      {tool.description}
                    </p>
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tool.features.map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs font-medium bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-md text-slate-700 dark:text-slate-300 border border-white/20 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-700/70">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{tool.stats}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 transition-colors duration-500 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      <span className="text-xs font-semibold">Launch</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4 text-center group transition-all duration-500 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-xy"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:bg-gradient-to-tl animate-gradient-xy">
              <Users className="text-white" size={18} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent">24</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Active Users</p>
          <p className="text-xs text-green-600 dark:text-green-400">+12% this week</p>
        </div>
        <div className="glass-card p-4 text-center group transition-all duration-500 border border-transparent hover:border-green-200/50 dark:hover:border-green-800/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-xy"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:bg-gradient-to-tl animate-gradient-xy">
              <FileText className="text-white" size={18} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Star className="text-white" size={8} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-emerald-600 group-hover:bg-clip-text group-hover:text-transparent">156</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Documents</p>
          <p className="text-xs text-green-600 dark:text-green-400">+8 today</p>
        </div>
        <div className="glass-card p-4 text-center group transition-all duration-500 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-xy"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:bg-gradient-to-tl animate-gradient-xy">
              <Code className="text-white" size={18} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <Zap className="text-white" size={8} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent">89</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Code Projects</p>
          <p className="text-xs text-green-600 dark:text-green-400">+5 this week</p>
        </div>
        <div className="glass-card p-4 text-center group transition-all duration-500 border border-transparent hover:border-orange-200/50 dark:hover:border-orange-800/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-xy"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:bg-gradient-to-tl animate-gradient-xy">
              <TrendingUp className="text-white" size={18} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Activity className="text-white" size={8} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-red-600 group-hover:bg-clip-text group-hover:text-transparent">98%</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Uptime</p>
          <p className="text-xs text-green-600 dark:text-green-400">Excellent</p>
        </div>
      </div>

      {/* Recent Rooms */}
      <div className="glass-card p-4 border border-transparent hover:border-white/20 transition-all duration-300 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Recent Rooms</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Continue where you left off</p>
          </div>
          <Link
            to="/rooms"
            className="btn-primary flex items-center space-x-1 hover:scale-105 transition-transform duration-300 text-sm px-3 py-2"
          >
            <Users size={16} />
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentRooms.map((room, index) => {
            const Icon = room.icon
            return (
              <Link
                key={room.id}
                to={`/${room.type}/${room.id}`}
                className="room-card-modern animate-fade-in-up group p-3 rounded-lg"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${room.gradient} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
                      <Icon size={18} />
                    </div>
                    <span className={`badge-modern badge-${room.type} text-xs font-semibold px-2 py-1 rounded-md`}>
                      {room.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-gradient transition-all duration-300">
                    {room.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{room.lastEdited}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{room.collaborators} users</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Demo Notifications - Try New Features */}
      <div className="glass-card p-4 mb-6 border border-transparent hover:border-white/20 transition-all duration-300 rounded-xl">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bell className="text-white" size={16} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Try the New Features
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Test our notification system and shortcuts</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => success('Welcome to Together Hub! Theme toggle is now available.')}
            className="btn-secondary text-xs flex items-center space-x-1 justify-center hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 px-2 py-2"
          >
            <Bell size={12} />
            <span>Success</span>
          </button>
          <button
            onClick={() => warning('Remember to save your work regularly.')}
            className="btn-secondary text-xs flex items-center space-x-1 justify-center hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-800 px-2 py-2"
          >
            <Bell size={12} />
            <span>Warning</span>
          </button>
          <button
            onClick={() => error('Connection lost. Please check your internet.')}
            className="btn-secondary text-xs flex items-center space-x-1 justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 px-2 py-2"
          >
            <Bell size={12} />
            <span>Error</span>
          </button>
          <button
            onClick={() => info('New keyboard shortcuts available! Press Ctrl+K to search.')}
            className="btn-secondary text-xs flex items-center space-x-1 justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 px-2 py-2"
          >
            <Bell size={12} />
            <span>Info</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">K</kbd>
            <span>Search</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">,</kbd>
            <span>Settings</span>
          </div>
        </div>
      </div>

      {/* Enhanced Floating Action Button */}
      <Link to="/rooms" className="fab group">
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </Link>
    </div>
  )
}

export default Home