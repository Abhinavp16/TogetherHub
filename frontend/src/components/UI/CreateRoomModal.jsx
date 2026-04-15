import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, FileText, Code, PenTool, Check, Video, Users, Mail, Plus } from 'lucide-react'
import { roomAPI, teamAPI } from '../../services/api'
import toast from 'react-hot-toast'

const ROOM_TYPES = [
  {
    value: 'document',
    label: 'Document',
    description: 'Rich text docs',
    icon: FileText,
    color: 'text-blue-500'
  },
  {
    value: 'code',
    label: 'Code Editor',
    description: 'Pair programming',
    icon: Code,
    color: 'text-emerald-500'
  },
  {
    value: 'whiteboard',
    label: 'Whiteboard',
    description: 'Flowcharts and ideas',
    icon: PenTool,
    color: 'text-purple-500'
  },
  {
    value: 'video',
    label: 'Video Call',
    description: 'Face to face sync',
    icon: Video,
    color: 'text-rose-500'
  }
]

const defaultFormState = {
  name: '',
  description: '',
  type: 'document',
  isPrivate: false,
  invites: [],
  teamId: ''
}

const CreateRoomModal = ({ isOpen, onClose, onCreate }) => {
  const modalRef = useRef(null)
  const [formData, setFormData] = useState(defaultFormState)
  const [emailInput, setEmailInput] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(true)
  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormState)
      setEmailInput('')
      setIsValidEmail(true)
      return
    }

    const loadTeams = async () => {
      setLoadingTeams(true)

      try {
        const response = await teamAPI.getTeams()
        setTeams(response.data)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load teams')
      } finally {
        setLoadingTeams(false)
      }
    }

    loadTeams()
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleAddInvite = () => {
    const email = emailInput.trim().toLowerCase()

    if (!email) {
      return
    }

    if (!validateEmail(email)) {
      setIsValidEmail(false)
      return
    }

    setFormData((current) => ({
      ...current,
      invites: current.invites.includes(email) ? current.invites : [...current.invites, email]
    }))
    setEmailInput('')
    setIsValidEmail(true)
  }

  const handleRemoveInvite = (emailToRemove) => {
    setFormData((current) => ({
      ...current,
      invites: current.invites.filter((email) => email !== emailToRemove)
    }))
  }

  const handleInviteKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      handleAddInvite()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        teamId: formData.teamId || undefined
      }

      const response = await roomAPI.createRoom(payload)
      toast.success('Room created successfully')
      onCreate(response.data)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] dark:border-white/5 dark:bg-[#0b0f19]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-8 pb-6 pt-8 dark:border-white/5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create collaborative space</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Set up the workspace, privacy, and invite list in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="space-y-6 border-b border-slate-100 px-8 py-7 dark:border-white/5 md:border-b-0 md:border-r">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Room Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sprint Planning"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-transparent dark:bg-[#1e293b] dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="What is this room for?"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-transparent dark:bg-[#1e293b] dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Visibility
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Private room</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Only members and invited emails can join.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label htmlFor="teamId" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Invite a Team
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">No team selected</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name} ({team.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {loadingTeams ? 'Loading teams...' : 'Select one real team to prefill room invites.'}
                </p>
              </div>
            </div>

            <div className="space-y-6 px-8 py-7">
              <div className="space-y-3">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Primary Tool</span>
                <div className="grid grid-cols-2 gap-3">
                  {ROOM_TYPES.map((type) => {
                    const Icon = type.icon

                    return (
                      <label
                        key={type.value}
                        className={`relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all ${
                          formData.type === type.value
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm dark:bg-indigo-500/10'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex flex-col space-y-2">
                          <div className={`w-max rounded-xl p-2.5 ${formData.type === type.value ? 'bg-white dark:bg-slate-800' : 'bg-slate-100 dark:bg-[#1e293b]'}`}>
                            <Icon size={20} className={type.color} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{type.label}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{type.description}</p>
                          </div>
                        </div>
                        {formData.type === type.value && (
                          <div className="absolute right-4 top-4 text-indigo-500">
                            <Check size={18} strokeWidth={3} />
                          </div>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Invite by Email
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) => {
                        setEmailInput(event.target.value)
                        setIsValidEmail(true)
                      }}
                      onKeyDown={handleInviteKeyDown}
                      placeholder="teammate@example.com"
                      className={`w-full rounded-2xl border bg-slate-50 py-3.5 pl-11 pr-4 font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-white/[0.03] dark:text-white ${
                        isValidEmail ? 'border-slate-200 dark:border-white/10' : 'border-red-400'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                {!isValidEmail && (
                  <p className="text-xs font-semibold text-red-500">Enter a valid email address to add an invite.</p>
                )}
                <div className="flex min-h-[3rem] flex-wrap gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  {formData.invites.length > 0 ? formData.invites.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => handleRemoveInvite(email)}
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white/10"
                    >
                      {email} ×
                    </button>
                  )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No manual invites added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-8 py-5 dark:border-white/5 dark:bg-white/[0.02] sm:flex-row">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Teams and manual email invites are merged automatically when the room is created.
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-transparent dark:bg-[#1e293b] dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || loading}
                className={`flex-1 rounded-2xl px-8 py-3 text-sm font-bold text-white transition-all sm:flex-none ${
                  !formData.name.trim() || loading
                    ? 'cursor-not-allowed bg-indigo-400 opacity-60'
                    : 'bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:-translate-y-px hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Creating space...' : 'Create Room'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default CreateRoomModal
