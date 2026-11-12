import { useEffect, useRef } from 'react'

// Runs `create` once each time `shouldCreate` becomes true.
// React StrictMode mounts effects twice in development, which used to create two workspaces per click.
// `create` receives `isMounted()` so it can skip navigation if the user has already left the page.
export const useOneTimeCreation = (shouldCreate, create) => {
  const startedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!shouldCreate) {
      startedRef.current = false
      return
    }

    if (startedRef.current) {
      return
    }

    startedRef.current = true
    create(() => mountedRef.current)
  }, [shouldCreate, create])
}
