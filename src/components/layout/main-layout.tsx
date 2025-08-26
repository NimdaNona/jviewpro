"use client"

import { useState } from 'react'
import { Menu, X, FileText, Settings, Crown, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function MainLayout({ children, sidebar, className }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - Logo and menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            
            <div className="flex items-center space-x-2">
              <FileText className="size-6 text-primary" />
              <h1 className="text-xl font-bold">JViewPro</h1>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Crown className="size-4 mr-2" />
              Upgrade
            </Button>

            <Button variant="ghost" size="sm">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              className={cn(
                'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-80 transform border-r bg-background transition-transform duration-200 ease-in-out lg:static lg:transform-none',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              )}
            >
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  {sidebar}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}

export function SidebarSection({ 
  title, 
  children, 
  collapsible = false,
  defaultExpanded = true,
  className 
}: { 
  title?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string 
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn('p-4', className)}>
      {title && (
        <div className="mb-3">
          {collapsible ? (
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 font-semibold text-sm"
            >
              {title}
            </Button>
          ) : (
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {title}
            </h3>
          )}
        </div>
      )}
      
      {(!collapsible || isExpanded) && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </Card>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center h-full text-center p-8 space-y-4',
      className
    )}>
      {Icon && (
        <div className="rounded-full bg-muted p-6">
          <Icon className="size-12 text-muted-foreground" />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      
      {action}
    </div>
  )
}