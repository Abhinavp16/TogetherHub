import { Link } from 'react-router-dom'
import { FileText, Code, PenTool, Users, Plus, Sparkles, Zap, Clock, Activity, ArrowRight, LayoutDashboard, Search, Star, MessageSquare, Bot } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { useState, useEffect } from 'react'
import { documentAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()
  const { success, warning, error, info } = useNotifications()

  const [recentRooms, setRecentRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % 4) // Cycle through 4 static cards
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await documentAPI.getDocuments()
        const docs = response.data.slice(0, 4).map(doc => ({
          id: doc._id,
          title: doc.title,
          type: doc.type,
          icon: doc.type === 'code' ? Code : doc.type === 'whiteboard' ? PenTool : FileText,
          lastEdited: new Date(doc.updatedAt).toLocaleDateString(),
          collaborators: (doc.collaborators?.length || 0) + 1,
          theme: doc.type === 'code'
            ? 'emerald'
            : doc.type === 'whiteboard'
              ? 'pink'
              : 'blue'
        }))
        setRecentRooms(docs.length > 0 ? docs : [
          // Fallback dummy data if empty so UI looks good
          { id: '1', title: 'Q3 Product Roadmap', type: 'document', icon: FileText, lastEdited: 'Just now', collaborators: 3, theme: 'blue' },
          { id: '2', title: 'Authentication Service', type: 'code', icon: Code, lastEdited: '2 hrs ago', collaborators: 2, theme: 'emerald' },
          { id: '3', title: 'Landing Page Flow', type: 'whiteboard', icon: PenTool, lastEdited: 'Yesterday', collaborators: 4, theme: 'pink' }
        ])
      } catch (error) {
        // Fallback for demo
        setRecentRooms([
          { id: '1', title: 'Q3 Product Roadmap', type: 'document', icon: FileText, lastEdited: 'Just now', collaborators: 3, theme: 'blue' },
          { id: '2', title: 'Authentication Service', type: 'code', icon: Code, lastEdited: '2 hrs ago', collaborators: 2, theme: 'emerald' },
          { id: '3', title: 'Landing Page Flow', type: 'whiteboard', icon: PenTool, lastEdited: 'Yesterday', collaborators: 4, theme: 'pink' }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  const tools = [
    {
      title: 'Document',
      desc: 'Collaborative writing',
      icon: FileText,
      path: '/document/new',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'group-hover:border-blue-500/50'
    },
    {
      title: 'Code Editor',
      desc: 'Real-time coding',
      icon: Code,
      path: '/code/new',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'group-hover:border-emerald-500/50'
    },
    {
      title: 'Whiteboard',
      desc: 'Visual planning',
      icon: PenTool,
      path: '/whiteboard/new',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-500/10',
      border: 'group-hover:border-pink-500/50'
    }
  ]

  const statCards = [
    {
      id: 1, name: "Lines of code", value: "1,248", trend: "+12%", trendUp: true, icon: Activity, iconColor: "text-indigo-600 dark:text-[#818cf8]", iconBg: "bg-indigo-100 dark:bg-[#2b2d4f]",
      bgGraphic: (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-500"></div>
          <Activity size={140} className="absolute -bottom-8 -right-8 text-indigo-500/10 transform rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700" strokeWidth={1} />
        </div>
      )
    },
    {
      id: 2, name: "Docs Created", value: "42", trend: "+5%", trendUp: true, icon: FileText, iconColor: "text-blue-600 dark:text-[#60a5fa]", iconBg: "bg-blue-100 dark:bg-[#213555]",
      bgGraphic: (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-500"></div>
          <FileText size={140} className="absolute top-12 -right-8 text-blue-500/10 transform rotate-[15deg] group-hover:rotate-0 transition-transform duration-700" strokeWidth={1} />
        </div>
      )
    },
    {
      id: 3, name: "Active Peers", value: "7", trend: "+2", trendUp: true, icon: Users, iconColor: "text-pink-600 dark:text-[#f472b6]", iconBg: "bg-pink-100 dark:bg-[#45253e]",
      bgGraphic: (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute right-0 -bottom-12 w-full h-32 bg-pink-500/20 blur-[40px] group-hover:h-40 transition-all duration-500"></div>
          <Users size={150} className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/4 text-pink-500/10 transform rotate-[-5deg] group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />
        </div>
      )
    },
    {
      id: 4, name: "Hours Saved", value: "14h", trend: "+15%", trendUp: true, icon: Clock, iconColor: "text-emerald-600 dark:text-[#34d399]", iconBg: "bg-emerald-100 dark:bg-[#1d3d35]",
      bgGraphic: (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-500"></div>
          <Clock size={160} className="absolute -bottom-10 -left-10 text-emerald-500/10 transform rotate-[30deg] group-hover:rotate-45 transition-transform duration-700" strokeWidth={1} />
        </div>
      )
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-2xl animate-fade-in-up transition-colors duration-300">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/50 dark:from-indigo-500/30 to-purple-300/50 dark:to-purple-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-200/50 dark:from-pink-500/20 to-rose-300/50 dark:to-rose-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3"></div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-10"></div>

        <div className="relative p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left z-10 w-full md:w-2/3">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 dark:bg-white/10 backdrop-blur-md border border-indigo-500/20 dark:border-white/20 rounded-full px-4 py-2 mb-6 shadow-sm dark:shadow-xl">
              <Sparkles className="text-indigo-600 dark:text-yellow-400" size={16} />
              <span className="text-sm font-semibold text-indigo-800 dark:text-white tracking-wide">Together Hub v2.0 is live!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight transition-colors">
              Welcome back, <br />
              <span className="bg-gradient-premium bg-clip-text text-transparent">
                {user?.name?.split(' ')[0] || 'Creator'}
              </span>
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 md:max-w-lg leading-relaxed transition-colors">
              Your workspace is ready. You have 3 documents waiting for your review and 2 active collaboration sessions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/document/new" className="px-6 py-3 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center space-x-2">
                <Plus size={20} />
                <span>New Project</span>
              </Link>
              <Link to="/rooms" className="px-6 py-3 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white rounded-2xl font-bold hover:bg-white/80 dark:hover:bg-white/20 transition-all shadow-md dark:shadow-lg hover:-translate-y-1 flex items-center space-x-2">
                <LayoutDashboard size={20} />
                <span>Browse Rooms</span>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-col w-1/3 z-10 h-[220px] relative perspective-1000 mt-8">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;

              // Calculate position in stack relative to active card
              let offset = (i - activeCardIndex + statCards.length) % statCards.length;

              const isActive = offset === 0;
              const isVisible = offset < 3; // Show top 3 cards to make stack

              // The older cards go upwards, get smaller, and fade a bit
              const translateY = offset * -20;
              const scale = 1 - offset * 0.05;
              const opacity = isVisible ? 1 - (offset * 0.3) : 0;
              const zIndex = statCards.length - offset;

              return (
                <div
                  key={stat.id}
                  className="absolute top-0 left-0 w-full bg-white dark:bg-[#1e2330] rounded-[2rem] p-7 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)] border border-slate-200 dark:border-white/5 overflow-hidden group"
                  style={{
                    transformOrigin: 'top center',
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                  onClick={() => setActiveCardIndex((prev) => (prev + 1) % statCards.length)}
                >
                  {stat.bgGraphic}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-[56px] h-[56px] ${stat.iconBg} rounded-[1.25rem] flex items-center justify-center relative z-10`}>
                        <Icon className={stat.iconColor} size={28} strokeWidth={2.5} />
                      </div>
                      <span className="bg-emerald-100 dark:bg-[#15392b] text-emerald-700 dark:text-[#10b981] text-[14px] font-bold px-4 py-1.5 rounded-full tracking-wide">
                        {stat.trend}
                      </span>
                    </div>
                    <h3 className="text-[44px] font-black mb-2 tracking-tight leading-none text-slate-900 dark:text-white drop-shadow-sm">{stat.value}</h3>
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-[17px]">{stat.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-8 space-y-8">

          {/* Quick Start Tools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Zap className="text-yellow-500" />
                Quick Start
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {tools.map((tool, index) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={index}
                    to={tool.path}
                    className={`group glass-card p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-transparent ${tool.border}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${tool.bg} ${tool.color} flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">{tool.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">{tool.desc}</p>

                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className={`inline-flex items-center text-sm font-bold ${tool.color}`}>
                        Create <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Clock className="text-blue-500" />
                Recent Projects
              </h2>
              <Link to="/rooms" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center text-sm">
                View All <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentRooms.map((room, index) => {
                const Icon = room.icon
                const themeColors = {
                  blue: 'bg-blue-500 text-white',
                  emerald: 'bg-emerald-500 text-white',
                  pink: 'bg-pink-500 text-white'
                }
                const badgeColors = {
                  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
                  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300'
                }

                return (
                  <Link
                    key={room.id}
                    to={`/${room.type}/${room.id}`}
                    className="flex items-center p-4 glass-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 shadow-md group-hover:scale-110 transition-transform ${themeColors[room.theme]}`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {room.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center">
                          <Clock size={12} className="mr-1" /> {room.lastEdited}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${badgeColors[room.theme]}`}>
                          {room.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center -space-x-2 mr-4 hidden sm:flex">
                      {[...Array(room.collaborators)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 flex items-center justify-center overflow-hidden">
                          <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} alt="user" />
                        </div>
                      ))}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white dark:group-hover:bg-blue-600 border border-slate-200 dark:border-slate-700 transition-colors">
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-white" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

        </div>

        {/* Sidebar Space */}
        <div className="md:col-span-4 space-y-8">
          {/* Stats Card */}
          <div className="glass-card p-6 border-t-4 border-t-purple-500">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-6 flex items-center">
              <Star className="mr-2 text-purple-500" size={20} /> Team Overview
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Weekly Goal</span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">78%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm block mb-1">Active Users</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">24</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm block mb-1">Total Docs</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">156</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Suggestions */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center">
              <MessageSquare className="mr-2 text-pink-500" size={20} /> System Status
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              All systems are fully operational. Test out the custom notification system using the buttons below.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => success('Changes saved successfully!')} className="p-3 text-sm font-bold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors border border-green-200 dark:border-green-800">
                Success
              </button>
              <button onClick={() => error('Failed to connect to server')} className="p-3 text-sm font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-800">
                Error
              </button>
              <button onClick={() => warning('Low disk space warning')} className="p-3 text-sm font-bold bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors border border-yellow-200 dark:border-yellow-800">
                Warning
              </button>
              <button onClick={() => info('New update available')} className="p-3 text-sm font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-800">
                Info
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Chatbot FAB */}
      <button className="fab group" title="Chatbot Assistant">
        <Bot size={24} className="group-hover:rotate-12 transition-transform duration-300 pointer-events-none" />
      </button>

    </div>
  )
}

export default Home