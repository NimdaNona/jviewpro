"use client"

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8'
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingSpinner({ 
  text = "Loading...", 
  size = 'md',
  className 
}: { 
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  return (
    <div className={cn("flex items-center justify-center space-x-2 py-8", className)}>
      <Spinner size={size} />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}