// Browser regression tests for the bugs fixed in October 2026. Each test reproduces the original problem.
import { expect, test } from '@playwright/test'
import { e2e } from '../playwright.config.mjs'
import { apiAs, canvasInk, newContext, signup } from './helpers.mjs'

const codeWorkspace = async (request, session, content) =>
  (
    await apiAs(request, session).post('/documents', {
      title: 'Run test',
      type: 'code',
      language: 'javascript',
      content
    })
  )._id

const runCode = async (browser, session, request, content) => {
  const id = await codeWorkspace(request, session, content)
  const context = await newContext(browser, session)
  const page = await context.newPage()
  await page.goto(`/code/${id}`)
  await expect(page.locator('.monaco-editor .view-lines')).toContainText(content.split('\n')[0].slice(0, 12))
  await page.getByRole('button', { name: 'Run' }).click()
  return { page, context }
}

test.describe('code Run sandbox (bugs 5 and 13)', () => {
  test('runs code and captures output', async ({ browser, request }) => {
    const session = await signup(request)
    const { page, context } = await runCode(browser, session, request, "console.log('sum', 2 + 3)\n")
    await expect(page.getByText('sum 5')).toBeVisible()
    await context.close()
  })

  test('an error does not hijack the page console', async ({ browser, request }) => {
    const session = await signup(request)
    const { page, context } = await runCode(browser, session, request, "throw new Error('boom')\n")
    await expect(page.getByText('Error: boom')).toBeVisible()
    expect(await page.evaluate(() => console.log.toString().includes('[native code]'))).toBe(true)
    await context.close()
  })

  test('shared code cannot read the login token', async ({ browser, request }) => {
    const session = await signup(request)
    const { page, context } = await runCode(
      browser,
      session,
      request,
      "console.log(localStorage.getItem('authToken'))\n"
    )
    await expect(page.getByText(/Error: localStorage is not defined/)).toBeVisible()
    await expect(page.getByText(session.token)).toHaveCount(0)
    await context.close()
  })

  test('an infinite loop is stopped without freezing the page', async ({ browser, request }) => {
    const session = await signup(request)
    const { page, context } = await runCode(browser, session, request, 'while (true) {}\n')
    await expect(page.getByText(/Stopped after 3s/)).toBeVisible({ timeout: 10_000 })
    expect(await page.evaluate(() => 1 + 1)).toBe(2)
    await context.close()
  })
})

test('view-only links cannot edit, and edits from the owner still arrive', async ({ browser, request }) => {
  const owner = await signup(request, 'Owner')
  const id = (await apiAs(request, owner).post('/documents', { title: 'Read me', type: 'text', linkAccess: 'view' }))
    ._id

  const ownerPage = await (await newContext(browser, owner)).newPage()
  const guestPage = await (await newContext(browser)).newPage()
  await ownerPage.goto(`/document/${id}`)
  await guestPage.goto(`/document/${id}`)

  await expect(guestPage.getByText('View only')).toBeVisible()
  await expect(guestPage.locator('.document-tiptap[contenteditable="false"]')).toBeVisible()

  await ownerPage.locator('.document-tiptap[contenteditable="true"]').click()
  await ownerPage.keyboard.type('Published by the owner')
  await expect(guestPage.locator('.document-tiptap')).toContainText('Published by the owner')
})

test('the owner can turn off link access from the editor', async ({ browser, request }) => {
  const owner = await signup(request, 'Owner')
  const id = (await apiAs(request, owner).post('/documents', { title: 'Closing', type: 'whiteboard' }))._id

  const ownerPage = await (await newContext(browser, owner)).newPage()
  await ownerPage.goto(`/whiteboard/${id}`)
  await ownerPage.getByLabel('Link access').selectOption('none')
  await expect(ownerPage.getByText('Link access updated')).toBeVisible()

  const guestPage = await (await newContext(browser)).newPage()
  await guestPage.goto(`/whiteboard/${id}`)
  await expect(guestPage.getByText('Whiteboard unavailable')).toBeVisible()
})

test('members can open a private room workspace (bug 10)', async ({ browser, request }) => {
  const owner = await signup(request, 'Owner')
  const member = await signup(request, 'Member')
  const room = await apiAs(request, owner).post('/rooms', {
    name: 'Private notes',
    type: 'document',
    isPrivate: true,
    invites: [member.email]
  })
  await apiAs(request, member).post(`/rooms/${room._id}/join`)

  const page = await (await newContext(browser, member)).newPage()
  await page.goto(room.joinPath)
  await expect(page.getByText('Live sync connected')).toBeVisible()
  await expect(page.locator('.document-tiptap[contenteditable="true"]')).toBeVisible()

  const guest = await (await newContext(browser)).newPage()
  await guest.goto(room.joinPath)
  await expect(guest.getByText('Document unavailable')).toBeVisible()
})

test('bullet lists show their markers and typing continues after a toolbar click (bugs 17, 28)', async ({
  browser,
  request
}) => {
  const session = await signup(request)
  const id = (await apiAs(request, session).post('/documents', { title: 'Lists', type: 'text' }))._id
  const page = await (await newContext(browser, session)).newPage()
  await page.goto(`/document/${id}`)
  await page.locator('.document-tiptap[contenteditable="true"]').click()
  await page.getByTitle('Bullet list').click()
  await page.keyboard.type('first item')
  await expect(page.locator('.document-tiptap ul li')).toHaveText('first item')
  const style = await page.evaluate(() => getComputedStyle(document.querySelector('.document-tiptap ul')).listStyleType)
  expect(style).toBe('disc')
})

test('the default pen is visible, and strokes appear for others while still being drawn (bugs 18, 27)', async ({
  browser,
  request
}) => {
  const session = await signup(request)
  const id = (await apiAs(request, session).post('/documents', { title: 'Board', type: 'whiteboard' }))._id
  const ownerPage = await (await newContext(browser, session)).newPage()
  const guestPage = await (await newContext(browser)).newPage()
  await ownerPage.goto(`/whiteboard/${id}`)
  await guestPage.goto(`/whiteboard/${id}`)
  await expect(guestPage.getByText('Live sync connected')).toBeVisible()

  const box = await ownerPage.locator('canvas').boundingBox()
  await ownerPage.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
  await ownerPage.mouse.down()
  for (let i = 1; i <= 30; i += 1) {
    await ownerPage.mouse.move(box.x + box.width * (0.2 + i * 0.01), box.y + box.height * 0.5)
  }

  // Still drawing: the guest must already see the in-progress stroke, assembled from deltas.
  await expect.poll(async () => (await canvasInk(guestPage)).inked).toBeGreaterThan(50)
  await ownerPage.mouse.up()

  const ink = await canvasInk(guestPage)
  expect(ink.brightest).toBeGreaterThan(200)
})

test('creating a new document makes exactly one document (bug 20)', async ({ browser, request }) => {
  const session = await signup(request)
  const before = (await apiAs(request, session).get('/documents')).length
  const page = await (await newContext(browser, session)).newPage()
  await page.goto('/document/new')
  await page.waitForURL(/\/document\/[a-f0-9]{24}$/)
  await page.waitForTimeout(1000)
  expect((await apiAs(request, session).get('/documents')).length - before).toBe(1)
})

test('a temporary server error during start-up does not sign the user out (bug 14)', async ({ browser, request }) => {
  const session = await signup(request)
  const context = await newContext(browser, session)
  const page = await context.newPage()
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 503, body: 'unavailable' }))
  await page.goto('/')
  await expect(page).not.toHaveURL(/\/login/)
  expect(await page.evaluate(() => Boolean(localStorage.getItem('authToken')))).toBe(true)
})

test('search finds real workspaces and the dashboard shows no placeholder people (bugs 19, 26)', async ({
  browser,
  request
}) => {
  const session = await signup(request)
  const title = `Quarterly roadmap ${Date.now()}`
  const id = (await apiAs(request, session).post('/documents', { title, type: 'text' }))._id

  const page = await (await newContext(browser, session)).newPage()
  await page.goto('/')
  await expect(page.getByText('Sarah joined Team Alpha')).toHaveCount(0)
  await expect(page.getByText('All changes saved')).toHaveCount(0)

  await page.getByTitle('Search (Ctrl+K)').click()
  await page.getByPlaceholder(/search/i).fill('Quarterly roadmap')
  // Click the search result itself (the title also appears in the sidebar's recent activity).
  await page.getByText('document workspace').first().click()
  await expect(page).toHaveURL(new RegExp(`/document/${id}$`))
})

test('meeting participants connect and chat with their real names (bugs 6, 15)', async ({ browser, request }) => {
  const host = await signup(request, 'Host Person')
  const guest = await signup(request, 'Second Person')
  const room = await apiAs(request, host).post('/rooms', { name: 'Standup', type: 'video' })

  const hostPage = await (await newContext(browser, host)).newPage()
  const guestPage = await (await newContext(browser, guest)).newPage()
  await hostPage.goto(`/video/${room._id}`)
  await guestPage.goto(`/video/${room._id}`)

  await expect(hostPage.getByText('2 participants')).toBeVisible()
  await expect(guestPage.getByText('2 participants')).toBeVisible()

  await guestPage.getByPlaceholder('Send a message...').fill('hello from the second person')
  await guestPage.keyboard.press('Enter')
  await expect(hostPage.getByText('hello from the second person')).toBeVisible()
  await expect(hostPage.getByText('Second Person').first()).toBeVisible()
})

test('the meeting server rejects sockets without a login', async ({ page }) => {
  await page.goto('/login')
  const result = await page.evaluate(
    async (serverUrl) => {
      const { io } = await import('/node_modules/.vite/deps/socket__io-client.js')
      return new Promise((resolve) => {
        const socket = io(serverUrl, { transports: ['websocket'], reconnection: false })
        socket.on('connect', () => resolve('connected'))
        socket.on('connect_error', (error) => resolve(error.message))
      })
    },
    e2e.apiUrl.replace(/\/api$/, '')
  )
  expect(result).toBe('unauthorized')
})
