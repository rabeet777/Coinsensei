import React from 'react'
import { cn } from '@/lib/utils'

interface CoinsenseiLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'default' | 'white'
}

export function CoinsenseiLogo({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default'
}: CoinsenseiLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - SVG based matching the provided design */}
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 100 100"
          className="drop-shadow-sm"
        >
          {/* Outer ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill={variant === 'white' ? '#ffffff' : '#00bcd4'}
            stroke="none"
          />
          
          {/* Inner white circle */}
          <circle
            cx="50"
            cy="50"
            r="32"
            fill={variant === 'white' ? '#f3f4f6' : '#ffffff'}
            stroke="none"
          />
          
          {/* Inner cyan circle with C design */}
          <circle
            cx="50"
            cy="50"
            r="20"
            fill={variant === 'white' ? '#ffffff' : '#00bcd4'}
            stroke="none"
          />
          
          {/* White dot in center */}
          <circle
            cx="50"
            cy="50"
            r="6"
            fill={variant === 'white' ? '#f3f4f6' : '#ffffff'}
            stroke="none"
          />
          
          {/* C-shaped cutout to create the "C" effect */}
          <path
            d="M 50 18 A 32 32 0 0 0 50 82 L 50 70 A 20 20 0 0 1 50 30 Z"
            fill={variant === 'white' ? '#f3f4f6' : '#ffffff'}
          />
        </svg>
      </div>

      {/* Logo Text - Only show if showText is true */}
      {showText && (
        <span className={cn(
          'font-bold tracking-wide',
          variant === 'white' 
            ? 'text-white' 
            : 'text-[#2563eb]',
          textSizeClasses[size]
        )}>
          COINSENSEI
        </span>
      )}
    </div>
  )
} 