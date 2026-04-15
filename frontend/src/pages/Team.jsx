import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Users, ShieldCheck, Shield, User as UserIcon, Trash2 } from 'lucide-react'
import { teamAPI } from '../services/api'

const ROLE_OPTIONS = ['admin', 'editor', 'viewer']

const Team = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTeamId, setActiveTeamId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [memberForm, setMemberForm] = useState({ email: '', role: 'viewer' })
  const [submitting, setSubmitting] = useState(false)

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getTeams()
      setTeams(response.data)
      setActiveTeamId((current) => {
        if (current && response.data.some((team) => team._id === current)) {
          return current
        }

        return response.data[0]?._id || ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const activeTeam = useMemo(
    () => teams.find((team) => team._id === activeTeamId) || teams[0] || null,
    [activeTeamId, teams]
  )

  const filteredMembers = useMemo(() => {
    if (!activeTeam) {
      return []
    }

    return activeTeam.members.filter((member) => {
      const haystack = `${member.name || ''} ${member.email || ''}`.toLowerCase()
      return haystack.includes(searchQuery.toLowerCase())
    })
  }, [activeTeam, searchQuery])

  const handleCreateTeam = async () => {
    if (!createForm.name.trim()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await teamAPI.createTeam(createForm)
      setTeams((current) => [response.data, ...current])
      setActiveTeamId(response.data._id)
      setCreateForm({ name: '', description: '' })
      setIsCreateOpen(false)
      toast.success('Team created successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddMember = async () => {
    if (!activeTeam) {
      return
    }

    setSubmitting(true)

    try {
      const response = await teamAPI.addMember(activeTeam._id, memberForm)
      setTeams((current) => current.map((team) => (team._id === response.data._id ? response.data : team)))
      setMemberForm({ email: '', role: 'viewer' })
      setIsAddMemberOpen(false)
      toast.success('Member added successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = async (memberId, role) => {
    if (!activeTeam) {
      return
    }

    try {
      const response = await teamAPI.updateMember(activeTeam._id, memberId, { role })
      setTeams((current) => current.map((team) => (team._id === response.data._id ? response.data : team)))
      toast.success('Member role updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!activeTeam) {
      return
    }

    try {
      const response = await teamAPI.removeMember(activeTeam._id, memberId)
      setTeams((current) => current.map((team) => (team._id === response.data._id ? response.data : team)))
      toast.success('Member removed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const getRoleIcon = (role) => {
    if (role === 'owner') {
      return <ShieldCheck size={16} className="text-yellow-500" />
    }

    if (role === 'admin') {
      return <Shield size={16} className="text-blue-500" />
    }

    return <UserIcon size={16} className="text-slate-500 dark:text-slate-400" />
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Teams</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Real teams, real members, and role-based access for collaboration.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md dark:border-white/10 dark:bg-[#1e2330] dark:text-white"
          >
            <Plus size={18} className="mr-2 inline text-indigo-500" />
            New Team
          </button>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            disabled={!activeTeam || !activeTeam.canManage}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0ea5e9] dark:hover:bg-blue-500"
          >
            <Plus size={18} className="mr-2 inline" />
            Add Member
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="space-y-3">
          <h2 className="px-1 text-lg font-bold text-slate-800 dark:text-white">Project Teams</h2>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-white/5 dark:bg-[#1e2330] dark:text-slate-400">
              Loading teams...
            </div>
          ) : teams.length > 0 ? teams.map((team) => (
            <button
              key={team._id}
              onClick={() => setActiveTeamId(team._id)}
              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                activeTeam?._id === team._id
                  ? 'translate-x-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:border-white/10 dark:bg-[#1e2434]'
                  : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-white/5 dark:bg-[#1e2330] dark:text-slate-200'
              }`}
            >
              <p className="font-bold">{team.name}</p>
              <p className={`mt-1 text-sm ${activeTeam?._id === team._id ? 'text-indigo-100 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                {team.memberCount} members
              </p>
            </button>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
              No teams yet. Create your first team to start assigning members and inviting groups into rooms.
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] transition-colors duration-300 dark:border-white/5 dark:bg-[#1e2330] dark:shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-transparent sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeTeam?.name || 'Select a team'}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {activeTeam?.description || 'Create a team to manage shared members and room invites.'}
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTeam ? `Search in ${activeTeam.name}...` : 'Search members...'}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
                  disabled={!activeTeam}
                />
              </div>
            </div>

            {!activeTeam ? (
              <div className="p-12 text-center">
                <Users size={40} className="mx-auto text-slate-400" />
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">No active team selected</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Pick an existing team or create a new one to manage roles and members.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-sm uppercase tracking-wider text-slate-500 dark:border-white/5 dark:bg-[#1a1f2c] dark:text-slate-400">
                      <th className="px-6 py-4 font-semibold">Member</th>
                      <th className="px-6 py-4 font-semibold">Contact</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                      <tr key={member.userId} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm dark:border-[#1e2330]"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Team member</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{member.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
                              {getRoleIcon(member.role)}
                            </div>
                            {activeTeam.canManage && member.role !== 'owner' ? (
                              <select
                                value={member.role}
                                onChange={(event) => handleRoleChange(member.userId, event.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold capitalize text-slate-800 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                                {member.role}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {activeTeam.canManage && member.role !== 'owner' ? (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500">Protected</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <Search size={28} className="mx-auto text-slate-400" />
                          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No members found</h3>
                          <p className="mt-1 text-slate-500 dark:text-slate-400">Try a different search query.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a1f2c]">
            <div className="border-b border-slate-100 p-6 dark:border-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Team</h3>
            </div>
            <div className="space-y-4 p-6">
              <input
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Team name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
              />
              <textarea
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description (optional)"
                rows="3"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-[#181e29]">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0ea5e9] dark:hover:bg-blue-500"
              >
                {submitting ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddMemberOpen && activeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a1f2c]">
            <div className="border-b border-slate-100 p-6 dark:border-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Member to {activeTeam.name}</h3>
            </div>
            <div className="space-y-4 p-6">
              <input
                type="email"
                value={memberForm.email}
                onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="member@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
              />
              <select
                value={memberForm.role}
                onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
              >
                <option value="viewer">viewer</option>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-[#181e29]">
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="rounded-xl px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0ea5e9] dark:hover:bg-blue-500"
              >
                {submitting ? 'Saving...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Team
