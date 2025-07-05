import React from 'react'
import Image from 'next/image'
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
  showText = false,
  variant = 'default'
}: CoinsenseiLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-32 h-12'
  }

  const imageSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 200
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Image */}
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <Image
          src="/logo.webp"
          alt="COINSENSEI Logo"
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="drop-shadow-sm"
          priority
        />
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