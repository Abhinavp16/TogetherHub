import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react'

const StatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSaved, setLastSaved] = useState(new Date())
  const [syncStatus, setSyncStatus] = useState('synced') // 'syncing', 'synced', 'error'

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

  // Simulate sync status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        setSyncStatus('syncing')
        setTimeout(() => {
          setSyncStatus('synced')
          setLastSaved(new Date())
        }, 1000)
      }
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(interval)
  }, [isOnline])

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    if (syncStatus === 'syncing') return 'text-yellow-500'
    if (syncStatus === 'error') return 'text-red-500'
    return 'text-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (syncStatus === 'syncing') return 'Syncing...'
    if (syncStatus === 'error') return 'Sync Error'
    return 'All changes saved'
  }

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff
    if (syncStatus === 'syncing') return Clock
    if (syncStatus === 'error') return WifiOff
    return CheckCircle
  }

  const StatusIcon = getStatusIcon()

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className="glass-card px-4 py-2 flex items-center space-x-2 text-sm">
        <StatusIcon 
          size={16} 
          className={`${getStatusColor()} ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} 
        />
        <span className="text-slate-700 dark:text-slate-300">
          {getStatusText()}
        </span>
        {isOnline && syncStatus === 'synced' && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatusIndicator