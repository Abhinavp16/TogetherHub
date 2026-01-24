import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationContext'

export const useKeyboardShortcuts = (callbacks = {}) => {
  const { toggleTheme } = useTheme()
  const { info } = useNotifications()

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event
      const isModifierPressed = ctrlKey || metaKey

      // Prevent default shortcuts in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      // Theme toggle: Ctrl/Cmd + Shift + T
      if (isModifierPressed && shiftKey && key.toLowerCase() === 't') {
        event.preventDefault()
        toggleTheme()
        info('Theme toggled')
        return
      }

      // Settings: Ctrl/Cmd + ,
      if (isModifierPressed && key === ',') {
        event.preventDefault()
        if (callbacks.openSettings) {
          callbacks.openSettings()
        }
        return
      }

      // New Room: Ctrl/Cmd + N
      if (isModifierPressed && key.toLowerCase() === 'n') {
        event.preventDefault()
        if (callbacks.createRoom) {
          callbacks.createRoom()
        }
        return
      }

      // Search: Ctrl/Cmd + K
      if (isModifierPressed && key.toLowerCase() === 'k') {
        event.preventDefault()
        if (callbacks.openSearch) {
          callbacks.openSearch()
        }
        return
      }

      // Help: F1 or ?
      if (key === 'F1' || (shiftKey && key === '?')) {
        event.preventDefault()
        if (callbacks.openHelp) {
          callbacks.openHelp()
        }
        return
      }

      // Escape: Close modals/panels
      if (key === 'Escape') {
        if (callbacks.closeModals) {
          callbacks.closeModals()
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleTheme, info, callbacks])
}

export default useKeyboardShortcuts