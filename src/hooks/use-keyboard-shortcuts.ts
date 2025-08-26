"use client"

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category?: string
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  target?: EventTarget | null
}

const DEFAULT_OPTIONS: UseKeyboardShortcutsOptions = {
  enabled: true,
  preventDefault: true,
  stopPropagation: true,
  target: null
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const shortcutsRef = useRef(shortcuts)
  
  // Update shortcuts reference
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!opts.enabled) return

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    )) {
      return
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const metaMatches = !!shortcut.metaKey === event.metaKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey

      return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
    })

    if (matchingShortcut) {
      if (opts.preventDefault) {
        event.preventDefault()
      }
      if (opts.stopPropagation) {
        event.stopPropagation()
      }
      
      matchingShortcut.action()
    }
  }, [opts])

  useEffect(() => {
    if (!opts.enabled) return

    const target = opts.target || document
    target.addEventListener('keydown', handleKeyDown as EventListener)

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, opts.enabled, opts.target])

  return {
    shortcuts: shortcutsRef.current
  }
}

export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts = []
  
  // Use Cmd on Mac, Ctrl on other platforms
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  if (shortcut.ctrlKey && !isMac) parts.push('Ctrl')
  if (shortcut.metaKey || (shortcut.ctrlKey && isMac)) parts.push(isMac ? 'Cmd' : 'Ctrl')
  if (shortcut.altKey) parts.push(isMac ? 'Option' : 'Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  
  // Format the key
  let key = shortcut.key
  if (key === ' ') key = 'Space'
  else if (key === 'ArrowUp') key = '↑'
  else if (key === 'ArrowDown') key = '↓'
  else if (key === 'ArrowLeft') key = '←'
  else if (key === 'ArrowRight') key = '→'
  else if (key === 'Enter') key = 'Enter'
  else if (key === 'Escape') key = 'Esc'
  else if (key === 'Delete') key = 'Del'
  else key = key.toUpperCase()
  
  parts.push(key)
  
  return parts.join(' + ')
}

export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'General'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(shortcut)
    return groups
  }, {} as Record<string, KeyboardShortcut[]>)
}