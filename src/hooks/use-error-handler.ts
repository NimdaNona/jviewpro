import { useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  onError?: (error: Error) => void
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { showToast = true, logError = true, onError } = options

  const handleError = useCallback((error: unknown, context?: string) => {
    const err = error instanceof Error ? error : new Error(String(error))
    
    if (logError) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, err)
    }

    if (showToast) {
      toast.error(err.message || 'An unexpected error occurred')
    }

    if (onError) {
      onError(err)
    }

    return err
  }, [showToast, logError, onError])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, context)
      return fallback
    }
  }, [handleError])

  return { handleError, handleAsyncError }
}