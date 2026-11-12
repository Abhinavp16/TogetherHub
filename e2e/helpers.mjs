import { expect } from '@playwright/test'
import { e2e } from '../playwright.config.mjs'

export const signup = async (request, name = 'E2E User') => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@togetherhub.test`
  const res = await request.post(`${e2e.apiUrl}/auth/signup`, {
    data: { name, email, password: 'e2e-password' }
  })
  expect(res.ok()).toBeTruthy()
  return { ...(await res.json()), email }
}

export const apiAs = (request, session) => ({
  post: async (path, data) => {
    const res = await request.post(`${e2e.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      data
    })
    expect(res.ok(), `${path} -> ${res.status()}`).toBeTruthy()
    return res.json()
  },
  patch: async (path, data) => {
    const res = await request.patch(`${e2e.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      data
    })
    expect(res.ok(), `${path} -> ${res.status()}`).toBeTruthy()
    return res.json()
  },
  get: async (path) => {
    const res = await request.get(`${e2e.apiUrl}${path}`, { headers: { Authorization: `Bearer ${session.token}` } })
    return res.json()
  }
})

// A browser context signed in as `session`, or a guest context when session is null.
export const newContext = async (browser, session = null) => {
  const context = await browser.newContext({ permissions: ['camera', 'microphone'] })
  if (session) {
    await context.addInitScript(
      ([token, user]) => {
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))
      },
      [session.token, session.user]
    )
  }
  return context
}

export const canvasInk = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('canvas')
    const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height)
    let inked = 0
    let brightest = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        inked += 1
        brightest = Math.max(brightest, Math.min(data[i], data[i + 1], data[i + 2]))
      }
    }
    return { inked, brightest }
  })
