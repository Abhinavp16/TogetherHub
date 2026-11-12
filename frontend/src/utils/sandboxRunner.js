// Runs untrusted JavaScript from a shared workspace in an isolated Web Worker.
// The worker has no access to the page, its DOM, localStorage (where the login token lives)
// or the page's console; network APIs are removed; and it is terminated after a time limit.

const WORKER_SOURCE = `
const blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel']
for (const name of blocked) {
  try { Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false }) } catch (e) {}
}

const format = (args) => args.map((value) => {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message
  try { return JSON.stringify(value) } catch (e) { return String(value) }
}).join(' ')

self.onmessage = async (event) => {
  const logs = []
  const capture = (type) => (...args) => logs.push({ type, message: format(args) })
  const sandboxConsole = { log: capture('log'), info: capture('log'), debug: capture('log'), warn: capture('warn'), error: capture('error') }

  try {
    const run = new Function('console', event.data.source)
    await run(sandboxConsole)
    // Give short timers a moment to log before reporting.
    await new Promise((resolve) => setTimeout(resolve, 50))
    self.postMessage({ ok: true, logs })
  } catch (error) {
    self.postMessage({ ok: false, logs, error: (error && error.message) || String(error) })
  }
}
`

export const runJavaScriptSandboxed = (source, { timeoutMs = 3000 } = {}) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
    const worker = new Worker(url)

    const finish = (result) => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(result)
    }

    const timer = setTimeout(
      () => finish({ ok: false, logs: [], error: `Stopped after ${timeoutMs / 1000}s. Check for an infinite loop.` }),
      timeoutMs
    )

    worker.onmessage = (event) => finish(event.data)
    worker.onerror = (event) => {
      event.preventDefault()
      finish({ ok: false, logs: [], error: event.message || 'Execution failed' })
    }
    worker.postMessage({ source })
  })
