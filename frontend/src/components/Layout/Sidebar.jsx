import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Code, PenTool, Users, TrendingUp } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { path: '/rooms', icon: Users, label: 'Rooms', gradient: 'from-green-500 to-emerald-500' },
    { path: '/document/new', icon: FileText, label: 'Document Editor', gradient: 'from-blue-500 to-indigo-500' },
    { path: '/code/new', icon: Code, label: 'Code Editor', gradient: 'from-green-500 to-teal-500' },
    { path: '/whiteboard/new', icon: PenTool, label: 'Whiteboard', gradient: 'from-purple-500 to-pink-500' },
  ]

  return (
    <aside className="w-72 glass-sidebar min-h-screen">
      <nav className="p-6">
        <ul className="space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.path} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link
                  to={item.path}
                  className={`nav-modern group ${isActive ? 'active' : ''}`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 ${isActive ? 'shadow-2xl scale-105' : ''}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-base group-hover:text-gradient transition-all duration-300">{item.label}</span>
                    {isActive && (
                      <div className="flex items-center space-x-1 mt-1">
                        <TrendingUp size={12} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</span>
                      </div>
                    )}
                  </div>
                  {!isActive && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 glass-card p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-white/20">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-lg">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm hover:bg-white/30 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-all duration-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-slate-600 dark:text-slate-400 font-medium">Document saved</span>
            </div>
            <div className="flex items-center space-x-3 text-sm hover:bg-white/30 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-all duration-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-slate-600 dark:text-slate-400 font-medium">User joined room</span>
            </div>
            <div className="flex items-center space-x-3 text-sm hover:bg-white/30 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-all duration-200">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-slate-600 dark:text-slate-400 font-medium">Code compiled</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar