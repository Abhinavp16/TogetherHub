// Two independent browsers edit the same workspace and must see each other's changes live.
import { expect, test } from '@playwright/test'
import { e2e } from '../playwright.config.mjs'

const signup = async (request) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@togetherhub.test`
  const res = await request.post(`${e2e.apiUrl}/auth/signup`, {
    data: { name: 'E2E Owner', email, password: 'e2e-password' }
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

const createWorkspace = async (request, token, body) => {
  const res = await request.post(`${e2e.apiUrl}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { shareAccess: 'link', ...body }
  })
  expect(res.ok()).toBeTruthy()
  return (await res.json())._id
}

// Browser A is the signed-in owner; browser B is a guest who only has the link.
const openPair = async (browser, session, path) => {
  const ownerContext = await browser.newContext()
  await ownerContext.addInitScript(
    ([token, user]) => {
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    [session.token, session.user]
  )
  const guestContext = await browser.newContext()
  const owner = await ownerContext.newPage()
  const guest = await guestContext.newPage()
  await owner.goto(path)
  await guest.goto(path)
  return { owner, guest, close: () => Promise.all([ownerContext.close(), guestContext.close()]) }
}

test('rich-text edits appear in the other browser', async ({ browser, request }) => {
  const session = await signup(request)
  const id = await createWorkspace(request, session.token, { title: 'E2E notes', type: 'text' })
  const { owner, guest, close } = await openPair(browser, session, `/document/${id}`)

  const editor = owner.locator('.document-tiptap[contenteditable="true"]')
  await expect(editor).toBeVisible()
  await expect(guest.locator('.document-tiptap[contenteditable="true"]')).toBeVisible()
  await editor.click()
  await owner.keyboard.type('Hello from browser A')

  await expect(guest.locator('.document-tiptap')).toContainText('Hello from browser A')
  await close()
})

test('code edits appear in the other browser', async ({ browser, request }) => {
  const session = await signup(request)
  const id = await createWorkspace(request, session.token, {
    title: 'E2E code',
    type: 'code',
    language: 'javascript',
    content: 'const answer = 42\n'
  })
  const { owner, guest, close } = await openPair(browser, session, `/code/${id}`)

  const ownerLines = owner.locator('.monaco-editor .view-lines')
  await expect(ownerLines).toContainText('answer')
  await expect(guest.locator('.monaco-editor .view-lines')).toContainText('answer')
  await ownerLines.click()
  await owner.keyboard.press('End')
  await owner.keyboard.type('// synced_from_a')

  await expect(guest.locator('.monaco-editor .view-lines')).toContainText('synced_from_a')
  await close()
})

test('whiteboard strokes appear in the other browser', async ({ browser, request }) => {
  const session = await signup(request)
  const id = await createWorkspace(request, session.token, { title: 'E2E board', type: 'whiteboard' })
  const { owner, guest, close } = await openPair(browser, session, `/whiteboard/${id}`)

  const canvas = owner.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(guest.locator('canvas')).toBeVisible()
  const guestHasInk = () =>
    guest.evaluate(() => {
      const c = document.querySelector('canvas')
      const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height)
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true
      return false
    })
  expect(await guestHasInk()).toBe(false)

  const box = await canvas.boundingBox()
  await owner.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4)
  await owner.mouse.down()
  for (let i = 1; i <= 20; i += 1) {
    await owner.mouse.move(box.x + box.width * (0.3 + i * 0.01), box.y + box.height * (0.4 + i * 0.005))
  }
  await owner.mouse.up()

  await expect.poll(guestHasInk).toBe(true)
  await close()
})
