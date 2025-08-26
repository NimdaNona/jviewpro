import { useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface AsyncStateActions<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<T | undefined>
  setData: (data: T) => void
  setError: (error: Error) => void
  reset: () => void
}

export function useAsyncState<T = any>(initialData: T | null = null): [AsyncState<T>, AsyncStateActions<T>] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | undefined> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await asyncFn()
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState(prev => ({ ...prev, loading: false, error: err }))
      return undefined
    }
  }, [])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  return [state, { execute, setData, setError, reset }]
}