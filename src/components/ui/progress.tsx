"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  showLabel?: boolean
  label?: string
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, size = 'md', variant = 'default', showLabel = false, label, className, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    }
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      destructive: 'bg-red-500'
    }

    return (
      <div className="space-y-1">
        {showLabel && (
          <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full bg-secondary",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }