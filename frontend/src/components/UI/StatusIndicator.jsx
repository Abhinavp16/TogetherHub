import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

// Shows the browser's real connectivity. Workspaces display their own live-sync status.
const StatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const StatusIcon = isOnline ? Wifi : WifiOff

  return (
    <div className="fixed bottom-8 right-8 z-40 hidden md:block animate-fade-in-up">
      <div className="glass-card px-4 py-2.5 flex items-center space-x-3 text-sm border hover:border-blue-500/30 transition-colors shadow-lg">
        <StatusIcon size={16} className={isOnline ? 'text-green-500' : 'text-red-500'} />
        <span className="text-slate-700 dark:text-slate-300">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  )
}

export default StatusIndicator
