"use client"

import { useState } from 'react'
import { HelpCircle, Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KeyboardShortcut, formatShortcutKey, groupShortcutsByCategory } from '@/hooks/use-keyboard-shortcuts'

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  trigger?: React.ReactNode
}

export function KeyboardShortcutsHelp({ shortcuts, trigger }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false)
  const groupedShortcuts = groupShortcutsByCategory(shortcuts)

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="Keyboard shortcuts"
    >
      <Keyboard className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with JViewPro more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{shortcut.description}</p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {formatShortcutKey(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {shortcuts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No keyboard shortcuts are currently available.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}