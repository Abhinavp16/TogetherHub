import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Code, PenTool, Users, TrendingUp, Shield } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { path: '/rooms', icon: Users, label: 'Rooms', gradient: 'from-green-500 to-emerald-500' },
    { path: '/document/new', icon: FileText, label: 'Document Editor', gradient: 'from-blue-500 to-indigo-500' },
    { path: '/code/new', icon: Code, label: 'Code Editor', gradient: 'from-green-500 to-teal-500' },
    { path: '/whiteboard/new', icon: PenTool, label: 'Whiteboard', gradient: 'from-purple-500 to-pink-500' },
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
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-[13px] uppercase tracking-[0.15em]">Activity Feed</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm">
                <div className="w-[34px] h-[34px] rounded-full bg-emerald-100 dark:bg-[#15392b] flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200 dark:border-[#10b981]/20 transition-colors">
                  <FileText size={15} className="text-emerald-600 dark:text-[#10b981]" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-medium leading-tight text-[14px]">Project Specs updated</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">2 mins ago by You</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <div className="w-[34px] h-[34px] rounded-full bg-blue-100 dark:bg-[#1e3a8a]/40 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200 dark:border-[#3b82f6]/20 transition-colors">
                  <Users size={15} className="text-blue-600 dark:text-[#3b82f6]" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-medium leading-tight text-[14px]">Sarah joined Team Alpha</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">1 hr ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar