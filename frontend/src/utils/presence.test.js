import { describe, expect, it } from 'vitest'
import { collaboratorColors, colorForId, createPresenceProfile, groupPresenceByUser } from './presence'

describe('colorForId', () => {
  it('is stable for the same id', () => {
    expect(colorForId('6ac4b2a3925aa400d34aca1e')).toBe(colorForId('6ac4b2a3925aa400d34aca1e'))
  })

  it('spreads same-length user ids across the palette (bug 12)', () => {
    // Every user id is a 24-character ObjectId; the old length-based colour gave all of them colour 0.
    const ids = Array.from({ length: 60 }, (_, i) =>
      (0x6ac4b2a3925aa400d34aca00n + BigInt(i * 7919)).toString(16).padStart(24, '0')
    )
    const colours = new Set(ids.map(colorForId))
    expect(colours.size).toBe(collaboratorColors.length)
  })
})

describe('createPresenceProfile', () => {
  it('uses the user id for identity and colour', () => {
    const profile = createPresenceProfile({ id: 'abc', name: 'Asha', avatar: 'a.png' })
    expect(profile).toMatchObject({ id: 'abc', name: 'Asha', color: colorForId('abc'), isGuest: false })
  })

  it('prefers the chosen display name', () => {
    expect(createPresenceProfile({ id: 'abc', name: 'Asha' }, 'Asha (laptop)').name).toBe('Asha (laptop)')
  })

  it('creates and remembers a guest identity', () => {
    localStorage.clear()
    const first = createPresenceProfile(null)
    const second = createPresenceProfile(null)
    expect(first.isGuest).toBe(true)
    expect(first.name).toMatch(/^Guest \d{4}$/)
    expect(second.id).toBe(first.id)
  })
})

describe('groupPresenceByUser', () => {
  it('shows one entry per person even with several tabs open (bug 24)', () => {
    const grouped = groupPresenceByUser([
      { clientId: 1, id: 'u1', name: 'Asha', typing: false },
      { clientId: 2, id: 'u1', name: 'Asha', typing: true },
      { clientId: 3, id: 'u2', name: 'Ravi', typing: false }
    ])
    expect(grouped).toHaveLength(2)
    expect(grouped.find((p) => p.id === 'u1')).toMatchObject({ typing: true, sessions: 2 })
  })
})
