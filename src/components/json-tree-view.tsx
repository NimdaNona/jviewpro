"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronRight, ChevronDown, Copy, Search, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { getJsonType } from '@/lib/json-parser'

interface JsonTreeNodeProps {
  data: any
  path?: string
  level?: number
  isExpanded?: boolean
  onToggle?: (path: string) => void
  onCopy?: (value: any, path: string) => void
  maxNodes?: number
  nodeCount?: { current: number }
  isLimited?: boolean
  searchTerm?: string
  searchResults?: {path: string, value: any, type: string}[]
  currentSearchIndex?: number
}

interface JsonTreeViewProps {
  data: any
  title?: string
  maxNodes?: number
  showPath?: boolean
  showTypes?: boolean
  className?: string
  onCopy?: (value: any, path: string) => void
}

function getValueColor(type: string): string {
  switch (type) {
    case 'string': return 'text-green-600 dark:text-green-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-purple-600 dark:text-purple-400'
    case 'null': return 'text-gray-500 dark:text-gray-400'
    default: return 'text-foreground'
  }
}

function formatValue(value: any, type: string): string {
  switch (type) {
    case 'string':
      return `"${value}"`
    case 'null':
      return 'null'
    case 'boolean':
    case 'number':
      return String(value)
    default:
      return String(value)
  }
}

function JsonTreeNode({
  data,
  path = '',
  level = 0,
  isExpanded = false,
  onToggle,
  onCopy,
  maxNodes = 50,
  nodeCount = { current: 0 },
  isLimited = false,
  searchTerm = '',
  searchResults = [],
  currentSearchIndex = -1
}: JsonTreeNodeProps) {
  const type = getJsonType(data)
  const isExpandable = type === 'object' || type === 'array'
  const hasChildren = isExpandable && (
    type === 'array' ? data.length > 0 : Object.keys(data).length > 0
  )

  const handleToggle = useCallback(() => {
    if (hasChildren && onToggle) {
      onToggle(path)
    }
  }, [hasChildren, onToggle, path])

  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy(data, path)
    }
  }, [onCopy, data, path])

  // Check if this node matches current search result
  const isCurrentSearchResult = searchResults.length > 0 && currentSearchIndex >= 0 && 
    searchResults[currentSearchIndex]?.path === path
  
  // Check if this node is a search result
  const isSearchResult = searchResults.some(result => result.path === path)

  // Function to highlight matching text
  const highlightText = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }, [])

  // Check if we've exceeded the node limit
  if (nodeCount.current >= maxNodes) {
    return (
      <div className={cn("py-1", level > 0 && "ml-6")}>
        <div className="text-muted-foreground text-sm italic">
          ... ({maxNodes} node limit reached) {isLimited && "- Subscribe for unlimited viewing"}
        </div>
      </div>
    )
  }

  nodeCount.current++

  const renderChildren = () => {
    if (!isExpanded || !hasChildren) return null

    const children = []
    
    if (type === 'array') {
      for (let i = 0; i < data.length && nodeCount.current < maxNodes; i++) {
        children.push(
          <JsonTreeNode
            key={i}
            data={data[i]}
            path={`${path}[${i}]`}
            level={level + 1}
            isExpanded={false}
            onToggle={onToggle}
            onCopy={onCopy}
            maxNodes={maxNodes}
            nodeCount={nodeCount}
            isLimited={isLimited}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
          />
        )
      }
    } else if (type === 'object') {
      const keys = Object.keys(data)
      for (let i = 0; i < keys.length && nodeCount.current < maxNodes; i++) {
        const key = keys[i]
        const childPath = path ? `${path}.${key}` : key
        children.push(
          <JsonTreeNode
            key={key}
            data={data[key]}
            path={childPath}
            level={level + 1}
            isExpanded={false}
            onToggle={onToggle}
            onCopy={onCopy}
            maxNodes={maxNodes}
            nodeCount={nodeCount}
            isLimited={isLimited}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
          />
        )
      }
    }

    return <div className="ml-4">{children}</div>
  }

  const renderKey = () => {
    const pathParts = path.split(/[.\[\]]/).filter(Boolean)
    const key = pathParts[pathParts.length - 1]
    
    if (!key && level === 0) return null
    
    if (path.includes('[') && path.includes(']')) {
      // Array index
      const match = path.match(/\[(\d+)\]$/)
      if (match) {
        return (
          <span className="text-blue-600 dark:text-blue-400 font-mono">
            [{match[1]}]:
          </span>
        )
      }
    }
    
    // Object key
    return (
      <span className="text-red-600 dark:text-red-400 font-mono">
        "{highlightText(key, searchTerm)}":
      </span>
    )
  }

  const renderValue = () => {
    if (isExpandable) {
      const itemCount = type === 'array' ? data.length : Object.keys(data).length
      const preview = type === 'array' ? `Array(${itemCount})` : `Object(${itemCount})`
      
      return (
        <span className="text-muted-foreground">
          {preview}
          {!isExpanded && itemCount > 0 && (
            <span className="ml-2 text-xs">
              {type === 'array' ? '[...]' : '{...}'}
            </span>
          )}
        </span>
      )
    }

    const formattedValue = formatValue(data, type)
    return (
      <span className={cn("font-mono text-sm", getValueColor(type))}>
        {highlightText(formattedValue, searchTerm)}
      </span>
    )
  }

  return (
    <div className="py-0.5">
      <div
        className={cn(
          "flex items-center group hover:bg-accent/50 rounded-sm py-1 px-2 -mx-2",
          level > 0 && "ml-4",
          isCurrentSearchResult && "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500",
          isSearchResult && !isCurrentSearchResult && "bg-yellow-100 dark:bg-yellow-900/30"
        )}
      >
        {/* Expansion toggle */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-5 w-5 p-0 mr-1 hover:bg-accent"
          >
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Key */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {renderKey()}
          {renderValue()}
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
            title="Copy value"
          >
            <Copy className="size-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {renderChildren()}
    </div>
  )
}

export function JsonTreeView({
  data,
  title = "JSON Data",
  maxNodes = 50,
  showPath = false,
  showTypes = false,
  className,
  onCopy
}: JsonTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']))
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<{path: string, value: any, type: string}[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  const handleCopy = useCallback(async (value: any, path: string) => {
    try {
      const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      await navigator.clipboard.writeText(textToCopy)
      
      if (onCopy) {
        onCopy(value, path)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [onCopy])

  const expandAll = useCallback(() => {
    // This is a simplified expand all - in a real implementation,
    // you'd want to traverse the data structure to get all paths
    setExpandedPaths(new Set(['', ...Array.from({ length: 20 }, (_, i) => `item${i}`)]))
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  // Search functionality
  const searchInJson = useCallback((obj: any, path: string = '', results: {path: string, value: any, type: string}[] = []): {path: string, value: any, type: string}[] => {
    if (!searchTerm.trim()) return []
    
    const searchLower = searchTerm.toLowerCase()
    const type = getJsonType(obj)
    
    // Check if current value matches search term
    const valueStr = String(obj).toLowerCase()
    if (valueStr.includes(searchLower)) {
      results.push({ path, value: obj, type })
    }
    
    // Check if path/key matches search term
    if (path.toLowerCase().includes(searchLower)) {
      results.push({ path, value: obj, type })
    }
    
    // Recursively search in objects and arrays
    if (type === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key
        searchInJson(value, newPath, results)
      })
    } else if (type === 'array') {
      obj.forEach((item: any, index: number) => {
        const newPath = `${path}[${index}]`
        searchInJson(item, newPath, results)
      })
    }
    
    return results
  }, [searchTerm])

  // Update search results when search term or data changes
  useEffect(() => {
    const results = searchInJson(data)
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    
    // Auto-expand paths for search results
    if (results.length > 0 && searchTerm.trim()) {
      setExpandedPaths(prev => {
        const pathsToExpand = new Set(prev)
        results.forEach(result => {
          const pathParts = result.path.split(/[.[\]]/).filter(Boolean)
          let currentPath = ''
          pathParts.forEach((part, index) => {
            if (index === 0) {
              currentPath = part
            } else {
              currentPath += result.path.includes('[') && result.path.includes(']') ? `[${part}]` : `.${part}`
            }
            pathsToExpand.add(currentPath)
          })
        })
        // Also expand the root
        pathsToExpand.add('')
        return pathsToExpand
      })
    }
  }, [data, searchInJson, searchTerm])

  const navigateSearchResults = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return
    
    if (direction === 'next') {
      setCurrentSearchIndex(prev => prev < searchResults.length - 1 ? prev + 1 : 0)
    } else {
      setCurrentSearchIndex(prev => prev > 0 ? prev - 1 : searchResults.length - 1)
    }
  }, [searchResults.length])

  const filteredData = data

  const nodeCount = { current: 0 }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-8"
              title="Search"
            >
              <Search className="size-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-8 text-xs"
            >
              <Eye className="size-4 mr-1" />
              Expand
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-8 text-xs"
            >
              <EyeOff className="size-4 mr-1" />
              Collapse
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search in JSON..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm border rounded-md bg-background"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setSearchResults([])
                      setCurrentSearchIndex(-1)
                    }}
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentSearchIndex + 1} of {searchResults.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateSearchResults('prev')}
                    disabled={searchResults.length === 0}
                    className="h-7 w-7 p-0"
                    title="Previous result"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateSearchResults('next')}
                    disabled={searchResults.length === 0}
                    className="h-7 w-7 p-0"
                    title="Next result"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {searchTerm && searchResults.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="font-mono text-sm max-h-[600px] overflow-auto border rounded-md p-4 bg-muted/30">
          <JsonTreeNode
            data={filteredData}
            path=""
            level={0}
            isExpanded={expandedPaths.has('')}
            onToggle={handleToggle}
            onCopy={handleCopy}
            maxNodes={maxNodes}
            nodeCount={nodeCount}
            isLimited={maxNodes < 1000}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
          />
        </div>

        {nodeCount.current >= maxNodes && (
          <Alert variant="warning" title="Node limit reached" className="mt-3">
            Showing first {maxNodes} nodes.
            {maxNodes < 1000 && (
              <span className="ml-2">
                <Button variant="link" size="sm" className="h-auto p-0">
                  Upgrade for unlimited viewing →
                </Button>
              </span>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}