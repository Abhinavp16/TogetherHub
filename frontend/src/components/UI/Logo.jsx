import React from 'react'
import { Hexagon } from 'lucide-react'

const Logo = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-14 h-14',
    xl: 'w-16 h-16'
  }

  const iconSizes = {
    small: 18,
    medium: 22,
    large: 28,
    xl: 32
  }

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    xl: 'text-4xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Premium CSS Logo */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0 group perspective-1000`}>
        <div className="absolute inset-0 bg-gradient-premium rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse-glow"></div>
        <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-lg transition-transform duration-500 transform group-hover:-translate-y-1">
          <Hexagon
            size={iconSizes[size]}
            className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500"
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${textSizeClasses[size]} m-0 p-0 font-extrabold bg-gradient-premium bg-clip-text text-transparent leading-none tracking-tight`}>
            Together Hub
          </h1>
          {size !== 'small' && size !== 'medium' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">
              Real Time Collaboration
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Logo