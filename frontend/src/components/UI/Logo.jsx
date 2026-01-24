import React from 'react'

const Logo = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    xl: 'text-4xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Original Together Hub Logo */}
      <div className={`${sizeClasses[size]} relative overflow-hidden group`}>
        <img 
          src="/together-hub-logo.jpeg" 
          alt="Together Hub Logo" 
          className="w-full h-full object-contain rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
        />
        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      </div>
      
      {/* Text */}
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold text-gradient leading-tight`}>
            Together Hub
          </h1>
          {size !== 'small' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
              Real Time Collaboration
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Logo