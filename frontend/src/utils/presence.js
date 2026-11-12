// Shared presence helpers for the document, code and whiteboard workspaces.

export const collaboratorColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669', '#0891b2']

// Stable colour per identity. Hashes the whole id: user ids all have the same length,
// so anything based on length gave every signed-in user the same colour.
export const colorForId = (id) => {
  const text = String(id ?? '')
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return collaboratorColors[hash % collaboratorColors.length]
}

export const buildGuestProfile = () => {
  let name = localStorage.getItem('guestDisplayName')
  let color = localStorage.getItem('guestDisplayColor')

  if (!name || !color) {
    name = `Guest ${Math.floor(1000 + Math.random() * 9000)}`
    color = collaboratorColors[Math.floor(Math.random() * collaboratorColors.length)]
    localStorage.setItem('guestDisplayName', name)
    localStorage.setItem('guestDisplayColor', color)
  }

  return {
    id: `guest-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    color,
    isGuest: true
  }
}

export const createPresenceProfile = (user, displayName) => {
  if (user) {
    const id = user.id || user._id || user.email

    return {
      id,
      name: displayName || user.name,
      color: colorForId(id),
      avatar: user.avatar || '',
      typing: false,
      isGuest: false
    }
  }

  const guestProfile = buildGuestProfile()

  return {
    ...guestProfile,
    name: displayName || guestProfile.name,
    typing: false
  }
}

// One entry per connected client (a user with two tabs open appears twice).
export const extractPresence = (awareness) => {
  if (!awareness) {
    return []
  }

  return Array.from(awareness.getStates().entries())
    .map(([clientId, state]) => {
      if (!state.user) {
        return null
      }

      return {
        clientId,
        ...state.user,
        cursor: state.cursor || null,
        draftStroke: state.draftStroke || null
      }
    })
    .filter(Boolean)
}

// One entry per person, for avatars, counts and the presence panel.
export const groupPresenceByUser = (entries) => {
  const byId = new Map()

  entries.forEach((entry) => {
    const existing = byId.get(entry.id)
    if (existing) {
      existing.typing = existing.typing || entry.typing
      existing.sessions += 1
    } else {
      byId.set(entry.id, { ...entry, sessions: 1 })
    }
  })

  return Array.from(byId.values())
}

export const getInitials = (name) => {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return '?'
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

// Token sent to the collaboration server: the login token, or "guest" when signed out.
export const getCollaborationToken = () => localStorage.getItem('authToken') || 'guest'
