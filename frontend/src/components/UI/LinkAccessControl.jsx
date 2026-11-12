import { useState } from 'react'
import { Link2 } from 'lucide-react'
import toast from 'react-hot-toast'

const OPTIONS = [
  { value: 'none', label: 'Link: no access' },
  { value: 'view', label: 'Link: can view' },
  { value: 'edit', label: 'Link: can edit' }
]

// Lets the workspace owner choose what someone holding only the link may do.
const LinkAccessControl = ({ role, linkAccess, onChange }) => {
  const [saving, setSaving] = useState(false)

  if (role !== 'owner') {
    return null
  }

  const handleChange = async (event) => {
    const next = event.target.value
    setSaving(true)
    try {
      await onChange(next)
      toast.success('Link access updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update link access')
    } finally {
      setSaving(false)
    }
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
      <Link2 size={15} className="text-slate-400" />
      <select
        aria-label="Link access"
        value={linkAccess || 'edit'}
        onChange={handleChange}
        disabled={saving}
        className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LinkAccessControl
