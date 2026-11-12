import { defineConfig, devices } from '@playwright/test'

// Dedicated ports and database so end-to-end runs never touch development data.
const API_PORT = 5055
const COLLAB_PORT = 1245
const WEB_PORT = 3055
const MONGODB_URI = process.env.E2E_MONGODB_URI || 'mongodb://localhost:27017/togetherhub_e2e'

export const e2e = {
  apiUrl: `http://localhost:${API_PORT}/api`,
  webUrl: `http://localhost:${WEB_PORT}`
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: e2e.webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // Fake camera and microphone so meeting tests can run WebRTC headlessly.
        launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }
      }
    }
  ],
  webServer: [
    {
      command: 'node server.js',
      cwd: './backend',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        COLLAB_PORT: String(COLLAB_PORT),
        MONGODB_URI,
        JWT_SECRET: 'e2e-secret-that-is-long-enough',
        CLIENT_URL: e2e.webUrl
      }
    },
    {
      command: `npm run dev -- --port ${WEB_PORT} --strictPort`,
      cwd: './frontend',
      url: e2e.webUrl,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_SERVER_URL: `http://localhost:${API_PORT}`,
        VITE_API_URL: e2e.apiUrl,
        VITE_COLLAB_URL: `ws://localhost:${COLLAB_PORT}`
      }
    }
  ]
})
