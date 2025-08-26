"use client"

import { useState, useCallback } from 'react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useKeyboardShortcuts, KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts'
import { FileText, AlertCircle, CheckCircle2, Keyboard } from 'lucide-react'
import { MainLayout, Sidebar, SidebarSection, EmptyState } from '@/components/layout/main-layout'
import { FileUpload, FileUploadStatus } from '@/components/file-upload'
import { JsonTreeView } from '@/components/json-tree-view'
import { JsonSyntaxHighlighter, CodeBlock } from '@/components/json-syntax-highlighter'
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { parseJsonString } from '@/lib/json-parser'
import { FileData } from '@/types'
import { FILE_LIMITS } from '@/config/constants'
import { toast } from 'sonner'

export default function HomePage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree')
  const [isProcessing, setIsProcessing] = useState(false)
  const { handleError } = useErrorHandler()

  const handleFileSelect = useCallback(async (newFiles: FileData[]) => {
    setIsProcessing(true)
    
    try {
      const processedFiles = await Promise.all(
        newFiles.map(async (file) => {
          try {
            const parseResult = parseJsonString(file.content, {
              maxNodes: FILE_LIMITS.freeViewLimit,
              strict: false
            })

            return {
              ...file,
              parsedData: parseResult.data,
              metadata: parseResult.metadata,
              errors: parseResult.errors,
              warnings: parseResult.warnings
            }
          } catch (error) {
            return {
              ...file,
              errors: [`Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }
          }
        })
      )

      setFiles(prev => [...prev, ...processedFiles])
      
      if (files.length === 0) {
        setActiveFileIndex(0)
      }

      toast.success(`${processedFiles.length} file(s) processed successfully`)

    } catch (error) {
      handleError(error, 'file processing')
    } finally {
      setIsProcessing(false)
    }
  }, [files.length, handleError])

  const handleFileError = useCallback((error: string) => {
    toast.error(error)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      
      if (index === activeFileIndex && newFiles.length > 0) {
        setActiveFileIndex(Math.min(activeFileIndex, newFiles.length - 1))
      } else if (newFiles.length === 0) {
        setActiveFileIndex(0)
      }
      
      return newFiles
    })
    
    toast.success('File removed')
  }, [activeFileIndex])

  const handleCopyValue = useCallback((value: any, path: string) => {
    toast.success(`Copied ${path || 'value'} to clipboard`)
  }, [])

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => document.querySelector<HTMLElement>('[role="button"][title="Browse Files"]')?.click(),
      description: 'Upload new files',
      category: 'File Operations'
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => setViewMode('tree'),
      description: 'Switch to tree view',
      category: 'View'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => setViewMode('raw'),
      description: 'Switch to raw view',
      category: 'View'
    },
    {
      key: 'ArrowUp',
      ctrlKey: true,
      action: () => {
        if (files.length > 0) {
          setActiveFileIndex(prev => prev > 0 ? prev - 1 : files.length - 1)
        }
      },
      description: 'Previous file',
      category: 'Navigation'
    },
    {
      key: 'ArrowDown',
      ctrlKey: true,
      action: () => {
        if (files.length > 0) {
          setActiveFileIndex(prev => prev < files.length - 1 ? prev + 1 : 0)
        }
      },
      description: 'Next file',
      category: 'Navigation'
    },
    {
      key: 'Delete',
      action: () => {
        if (activeFile && files.length > 0) {
          handleRemoveFile(activeFileIndex)
        }
      },
      description: 'Remove current file',
      category: 'File Operations'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        const searchToggle = document.querySelector<HTMLElement>('[title="Search"]')
        if (searchToggle) {
          searchToggle.click()
          // Focus the search input after a brief delay
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search in JSON..."]')
            searchInput?.focus()
          }, 100)
        }
      },
      description: 'Toggle search',
      category: 'Search'
    },
    {
      key: 'F3',
      action: () => {
        const nextButton = document.querySelector<HTMLElement>('[title="Next result"]')
        nextButton?.click()
      },
      description: 'Next search result',
      category: 'Search'
    },
    {
      key: 'F3',
      shiftKey: true,
      action: () => {
        const prevButton = document.querySelector<HTMLElement>('[title="Previous result"]')
        prevButton?.click()
      },
      description: 'Previous search result',
      category: 'Search'
    },
    {
      key: 'Escape',
      action: () => {
        const clearButton = document.querySelector<HTMLElement>('input[placeholder="Search in JSON..."] + button')
        clearButton?.click()
      },
      description: 'Clear search',
      category: 'Search'
    },
    {
      key: '?',
      action: () => {
        // This will be handled by the KeyboardShortcutsHelp component
      },
      description: 'Show keyboard shortcuts',
      category: 'Help'
    }
  ]

  // Enable keyboard shortcuts
  useKeyboardShortcuts(shortcuts)

  const activeFile = files[activeFileIndex]

  const sidebar = (
    <Sidebar>
      <SidebarSection title="Files">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <Button
                key={index}
                variant={index === activeFileIndex ? "default" : "ghost"}
                className="w-full justify-start h-auto p-3"
                onClick={() => setActiveFileIndex(index)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0">
                    {file.errors && file.errors.length > 0 ? (
                      <AlertCircle className="size-4 text-destructive" />
                    ) : file.parsedData ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </SidebarSection>

      {activeFile && (
        <>
          <SidebarSection title="View Mode">
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'tree' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="flex-1"
              >
                Tree
              </Button>
              <Button
                variant={viewMode === 'raw' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('raw')}
                className="flex-1"
              >
                Raw
              </Button>
            </div>
          </SidebarSection>

          <SidebarSection title="Help">
            <KeyboardShortcutsHelp 
              shortcuts={shortcuts}
              trigger={
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Shortcuts
                </Button>
              }
            />
          </SidebarSection>

          <SidebarSection title="File Info">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{(activeFile.size / 1024).toFixed(1)} KB</span>
              </div>
              
              {activeFile.metadata && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{activeFile.metadata.type}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nodes:</span>
                    <span>{activeFile.metadata.nodeCount}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depth:</span>
                    <span>{activeFile.metadata.depth}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid:</span>
                    <span className={activeFile.metadata.isValid ? "text-green-600" : "text-red-600"}>
                      {activeFile.metadata.isValid ? "Yes" : "No"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </SidebarSection>

          {activeFile.warnings && activeFile.warnings.length > 0 && (
            <SidebarSection title="Warnings">
              <div className="space-y-1">
                {activeFile.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400">
                    {warning}
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {activeFile.errors && activeFile.errors.length > 0 && (
            <SidebarSection title="Errors">
              <div className="space-y-1">
                {activeFile.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}
        </>
      )}
    </Sidebar>
  )

  return (
    <ErrorBoundary>
      <MainLayout sidebar={sidebar}>
        <div className="h-full p-6">
        {files.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Upload JSON Files"
            description="Drag and drop your JSON files here to start viewing and analyzing them. Supports JSON, TXT, and ZIP files."
            action={
              <FileUpload
                onFileSelect={handleFileSelect}
                onError={handleFileError}
                className="w-full max-w-2xl"
              />
            }
          />
        ) : (
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add More Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onError={handleFileError}
                  className="w-full"
                />
                
                <FileUploadStatus
                  files={files}
                  onRemove={handleRemoveFile}
                />
              </CardContent>
            </Card>

            {/* JSON Viewer */}
            {activeFile && (
              <>
                {activeFile.errors && activeFile.errors.length > 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Failed to Parse File</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {activeFile.errors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : activeFile.parsedData ? (
                  viewMode === 'tree' ? (
                    <JsonTreeView
                      data={activeFile.parsedData}
                      title={`${activeFile.name} - Tree View`}
                      maxNodes={FILE_LIMITS.freeViewLimit}
                      onCopy={handleCopyValue}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {activeFile.name} - Raw View
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CodeBlock
                          code={activeFile.content}
                          language="json"
                          maxHeight="600px"
                        />
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <LoadingSpinner 
                        text="Processing JSON file..." 
                        size="lg" 
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
        <Toaster />
      </MainLayout>
    </ErrorBoundary>
  )
}
