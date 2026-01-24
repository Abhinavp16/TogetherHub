import React from 'react'

const LogoIcon = ({ size = 24, className = '' }) => {
  return (
    <img 
      src="/together-hub-logo.jpeg" 
      alt="Together Hub" 
      width={size} 
      height={size} 
      className={`object-contain rounded-lg ${className}`}
    />
  )
}

export default LogoIcon