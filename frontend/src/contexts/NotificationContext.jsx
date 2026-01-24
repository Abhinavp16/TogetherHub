import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const NotificationItem = ({ notification, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const Icon = icons[notification.type] || Info

  const typeStyles = {
    success: 'border-l-green-500 bg-green-50/90 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    error: 'border-l-red-500 bg-red-50/90 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    warning: 'border-l-yellow-500 bg-yellow-50/90 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    info: 'border-l-blue-500 bg-blue-50/90 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
  }

  return (
    <div className={`notification-modern border-l-4 p-4 mb-3 ${typeStyles[notification.type]} animate-slide-in-right`}>
      <div className="flex items-start">
        <Icon size={20} className="mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {notification.title && (
            <h4 className="font-semibold mb-1">{notification.title}</h4>
          )}
          <p className="text-sm">{notification.message}</p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-3 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors duration-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'success' })
  }, [addNotification])

  const error = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'error', duration: 7000 })
  }, [addNotification])

  const warning = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'warning' })
  }, [addNotification])

  const info = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'info' })
  }, [addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-6 right-6 z-50 max-w-sm w-full">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}