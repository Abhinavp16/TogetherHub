import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Code, PenTool, Users, Shield, Video } from 'lucide-react'
import { dashboardAPI } from '../../services/api'

const WORKSPACE_ICONS = { document: FileText, code: Code, whiteboard: PenTool }

const timeAgo = (date) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const Sidebar = () => {
  const location = useLocation()
  const [recentWorkspaces, setRecentWorkspaces] = useState([])

  useEffect(() => {
    let cancelled = false
    dashboardAPI
      .getSummary()
      .then((response) => {
        if (!cancelled) setRecentWorkspaces(response.data.recentWorkspaces.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { path: '/rooms', icon: Users, label: 'Rooms', gradient: 'from-green-500 to-emerald-500' },
    { path: '/document/new', icon: FileText, label: 'Document Editor', gradient: 'from-blue-500 to-indigo-500' },
    { path: '/code/new', icon: Code, label: 'Code Editor', gradient: 'from-green-500 to-teal-500' },
    { path: '/whiteboard/new', icon: PenTool, label: 'Whiteboard', gradient: 'from-purple-500 to-pink-500' },
    { path: '/video/new', icon: Video, label: 'Meeting Room', gradient: 'from-rose-500 to-orange-500' },
    { path: '/team', icon: Shield, label: 'My Team', gradient: 'from-yellow-400 to-amber-500' },
  ]

  return (
    <aside className="w-[280px] bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-white/5 h-full overflow-y-auto scrollbar-modern flex flex-col transition-colors duration-300">
      <nav className="p-5 flex-1 flex flex-col">
        <ul className="space-y-2 relative">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.path} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-4 p-2.5 rounded-[1rem] transition-all duration-300 group ${isActive
                    ? 'bg-slate-100 dark:bg-[#1e2434] shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-[#1a202c]'
                    }`}
                >
                  <div className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center transition-all duration-300 ${isActive
                    ? `bg-[#0ea5e9] text-white shadow-lg`
                    : 'bg-slate-100 dark:bg-[#181e29] text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'
                    }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex-1">
                    <span className={`font-bold transition-all duration-300 text-[15px] tracking-wide ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'
                      }`}>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.8)] mr-1"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-auto pt-8">
          <div className="bg-slate-50 dark:bg-[#1e2330] rounded-3xl p-5 relative overflow-hidden group shadow-sm dark:shadow-xl border border-slate-200 dark:border-white/5 transition-colors duration-300">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-[13px] uppercase tracking-[0.15em]">Recent Activity</h4>
            {recentWorkspaces.length === 0 ? (
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Workspaces you edit will appear here.</p>
            ) : (
              <div className="space-y-4">
                {recentWorkspaces.map((workspace) => {
                  const Icon = WORKSPACE_ICONS[workspace.type] || FileText
                  return (
                    <Link key={workspace.id} to={workspace.joinPath} className="flex items-start space-x-3 text-sm group">
                      <div className="w-[34px] h-[34px] rounded-full bg-blue-100 dark:bg-[#1e3a8a]/40 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200 dark:border-[#3b82f6]/20 transition-colors">
                        <Icon size={15} className="text-blue-600 dark:text-[#3b82f6]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-slate-800 dark:text-white font-medium leading-tight text-[14px] group-hover:underline">{workspace.title}</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Updated {timeAgo(workspace.updatedAt)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
