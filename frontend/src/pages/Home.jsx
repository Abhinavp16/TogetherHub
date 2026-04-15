import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Code,
  PenTool,
  Users,
  Plus,
  Zap,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Video,
  FolderKanban,
  UserPlus
} from 'lucide-react'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const iconMap = {
  document: FileText,
  code: Code,
  whiteboard: PenTool,
  video: Video
}

const colorMap = {
  document: 'bg-blue-500 text-white',
  code: 'bg-emerald-500 text-white',
  whiteboard: 'bg-pink-500 text-white',
  video: 'bg-rose-500 text-white'
}

const Home = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState({
    stats: {
      workspaceCount: 0,
      roomCount: 0,
      teamCount: 0,
      collaboratorCount: 0
    },
    recentWorkspaces: [],
    recentRooms: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await dashboardAPI.getSummary()
        setSummary(response.data)
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const tools = [
    {
      title: 'Document',
      desc: 'Collaborative writing',
      icon: FileText,
      path: '/document/new',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: 'Code Editor',
      desc: 'Real-time coding',
      icon: Code,
      path: '/code/new',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      title: 'Whiteboard',
      desc: 'Visual planning',
      icon: PenTool,
      path: '/whiteboard/new',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-500/10'
    },
    {
      title: 'Meeting Room',
      desc: 'Video collaboration',
      icon: Video,
      path: '/video/new',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-500/10'
    }
  ]

  const statCards = useMemo(() => [
    {
      label: 'Workspaces',
      value: summary.stats.workspaceCount,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-300',
      bg: 'bg-indigo-100 dark:bg-indigo-500/10'
    },
    {
      label: 'Rooms',
      value: summary.stats.roomCount,
      icon: LayoutDashboard,
      color: 'text-blue-600 dark:text-blue-300',
      bg: 'bg-blue-100 dark:bg-blue-500/10'
    },
    {
      label: 'Teams',
      value: summary.stats.teamCount,
      icon: Users,
      color: 'text-pink-600 dark:text-pink-300',
      bg: 'bg-pink-100 dark:bg-pink-500/10'
    },
    {
      label: 'Collaborators',
      value: summary.stats.collaboratorCount,
      icon: UserPlus,
      color: 'text-emerald-600 dark:text-emerald-300',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10'
    }
  ], [summary.stats])

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <div className="overflow-hidden rounded-[2.25rem] border border-indigo-100 bg-indigo-50 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl">
        <div className="relative p-8 md:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-300/50 blur-[100px] dark:from-indigo-500/30 dark:to-purple-600/30" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tr from-pink-200/50 to-rose-300/50 blur-[80px] dark:from-pink-500/20 dark:to-rose-500/20" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-800 dark:border-white/20 dark:bg-white/10 dark:text-white">
                <Zap size={16} className="text-indigo-600 dark:text-yellow-400" />
                Real workspace snapshot
              </div>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Welcome back, {user?.name?.split(' ')[0] || 'Creator'}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Your dashboard now reflects real workspaces, rooms, teams, and collaborators instead of static demo content.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/document/new" className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-indigo-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  <Plus size={18} />
                  New Workspace
                </Link>
                <Link to="/rooms" className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-5 py-2.5 font-bold text-slate-800 shadow-md transition-all hover:-translate-y-1 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                  <LayoutDashboard size={18} />
                  Browse Rooms
                </Link>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 lg:max-w-xl">
              {statCards.map((stat) => {
                const Icon = stat.icon

                return (
                  <div key={stat.label} className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] dark:border-white/5 dark:bg-[#1e2330] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${stat.bg}`}>
                        <Icon className={stat.color} size={24} strokeWidth={2.5} />
                      </div>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{loading ? '…' : stat.value}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
                <Zap className="text-yellow-500" />
                Quick Start
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => {
                const Icon = tool.icon

                return (
                  <Link
                    key={tool.title}
                    to={tool.path}
                    className="group glass-card flex flex-col items-center border border-transparent p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${tool.bg} ${tool.color} shadow-sm transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-slate-800 dark:text-slate-200">{tool.title}</h3>
                    <p className="text-sm font-medium text-slate-500">{tool.desc}</p>
                    <div className="mt-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className={`inline-flex items-center text-sm font-bold ${tool.color}`}>
                        Create <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
                <Clock className="text-blue-500" />
                Recent Workspaces
              </h2>
              <Link to="/rooms" className="flex items-center text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                View Rooms <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {summary.recentWorkspaces.length > 0 ? summary.recentWorkspaces.map((workspace) => {
                const Icon = iconMap[workspace.type] || FileText
                const colors = colorMap[workspace.type] || colorMap.document

                return (
                  <Link
                    key={workspace.id}
                    to={workspace.joinPath}
                    className="group flex items-center rounded-3xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/5 dark:bg-[#1e2330]"
                  >
                    <div className={`mr-5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-md transition-transform group-hover:scale-110 ${colors}`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                        {workspace.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-4">
                        <span className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                          <Clock size={12} className="mr-1" />
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize text-slate-700 dark:bg-white/10 dark:text-slate-300">
                          {workspace.type}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {workspace.collaboratorCount} collaborator{workspace.collaboratorCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors group-hover:bg-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:group-hover:bg-blue-600">
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-white" />
                    </div>
                  </Link>
                )
              }) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                  <FileText size={32} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">No workspaces yet</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Create your first document, code workspace, whiteboard, or meeting room to populate this dashboard.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8 md:col-span-4">
          <section className="glass-card border-t-4 border-t-purple-500 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Workspace Snapshot</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Accessible rooms</span>
                <span className="mt-1 block text-2xl font-extrabold text-slate-800 dark:text-slate-100">{loading ? '…' : summary.stats.roomCount}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Active teams</span>
                <span className="mt-1 block text-2xl font-extrabold text-slate-800 dark:text-slate-100">{loading ? '…' : summary.stats.teamCount}</span>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Rooms</h2>
            <div className="mt-4 space-y-3">
              {summary.recentRooms.length > 0 ? summary.recentRooms.map((room) => (
                <Link
                  key={room.id}
                  to={room.joinPath || '/rooms'}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-300 hover:bg-white dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{room.name}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        {room.type} · {room.memberCount} member{room.memberCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400" />
                  </div>
                </Link>
              )) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  No recent rooms yet. Rooms you create or join will appear here.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Home
