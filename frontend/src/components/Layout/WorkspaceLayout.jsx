import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Code,
  FileText,
  Home,
  Minimize2,
  PanelLeft,
  PenTool,
  Users,
  X
} from 'lucide-react'
import Logo from '../UI/Logo'

const navigationLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Rooms', to: '/rooms', icon: Users },
  { label: 'Team', to: '/team', icon: Users }
]

const workspaceLinks = [
  { label: 'New Document', to: '/document/new', icon: FileText },
  { label: 'New Code Editor', to: '/code/new', icon: Code },
  { label: 'New Whiteboard', to: '/whiteboard/new', icon: PenTool }
]

const WorkspaceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const workspaceTitle = useMemo(() => {
    if (location.pathname.startsWith('/document/')) return 'Document Workspace'
    if (location.pathname.startsWith('/code/')) return 'Code Workspace'
    if (location.pathname.startsWith('/whiteboard/')) return 'Whiteboard Workspace'
    return 'Workspace'
  }, [location.pathname])

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="pointer-events-auto mx-auto flex max-w-[1600px] items-center justify-between rounded-[1.4rem] border border-white/10 bg-slate-900/80 px-4 py-3 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.95)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
              title="Open workspace sidebar"
            >
              <PanelLeft size={18} />
            </button>

            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Full Screen Mode
              </p>
              <h1 className="text-sm font-semibold text-white">{workspaceTitle}</h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            title="Minimize to dashboard"
          >
            <Minimize2 size={16} />
            <span className="hidden sm:inline">Minimize</span>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-white/10 bg-slate-950/96 px-5 pb-6 pt-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-start justify-between gap-3">
          <Logo size="medium" className="min-w-0" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Workspace
          </p>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">{workspaceTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Editors open in an immersive view. Use minimize to jump back to the dashboard.
            </p>
          </div>
        </div>

        <div className="mb-8 space-y-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Navigation
          </p>
          {navigationLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Create
          </p>
          {workspaceLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </aside>

      <main className="h-full overflow-hidden px-4 pb-4 pt-24 sm:px-5 sm:pb-5">
        <div className="h-full overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-900/55 shadow-[0_30px_90px_-42px_rgba(15,23,42,0.95)] backdrop-blur-xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default WorkspaceLayout
