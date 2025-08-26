"use client"

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const alertVariants = {
  default: 'border-border bg-background text-foreground',
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
}

const iconMap = {
  default: null,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info
}

export function Alert({ 
  variant = 'default', 
  title, 
  children, 
  dismissible = false,
  onDismiss,
  className 
}: AlertProps) {
  const Icon = iconMap[variant]

  return (
    <div 
      className={cn(
        'relative rounded-lg border p-4',
        alertVariants[variant],
        className
      )}
      role="alert"
    >
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute right-2 top-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
        >
          <X className="size-3" />
        </Button>
      )}
      
      <div className="flex space-x-3">
        {Icon && (
          <Icon className="size-5 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-1">
          {title && (
            <h5 className="font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className={cn("text-sm", title && "mt-2")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}