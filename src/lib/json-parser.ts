import { ValidationResult, ProcessedData } from '@/types'

export interface JsonParseOptions {
  maxDepth?: number
  maxNodes?: number
  strict?: boolean
}

export interface ParseResult {
  data: any
  metadata: {
    size: number
    depth: number
    nodeCount: number
    type: string
    isValid: boolean
    parseTime: number
  }
  errors?: string[]
  warnings?: string[]
}

export function parseJsonString(
  jsonString: string, 
  options: JsonParseOptions = {}
): ParseResult {
  const startTime = performance.now()
  const {
    maxDepth = 100,
    maxNodes = 10000,
    strict = false
  } = options

  const result: ParseResult = {
    data: null,
    metadata: {
      size: jsonString.length,
      depth: 0,
      nodeCount: 0,
      type: 'unknown',
      isValid: false,
      parseTime: 0
    },
    errors: [],
    warnings: []
  }

  try {
    // Validate JSON syntax
    if (!isValidJsonSyntax(jsonString)) {
      result.errors?.push('Invalid JSON syntax')
      return result
    }

    // Parse JSON
    const parsed = JSON.parse(jsonString)
    result.data = parsed
    result.metadata.isValid = true

    // Analyze the parsed data
    const analysis = analyzeJsonStructure(parsed, maxDepth, maxNodes)
    result.metadata.depth = analysis.depth
    result.metadata.nodeCount = analysis.nodeCount
    result.metadata.type = analysis.type

    // Check for limits
    if (analysis.depth > maxDepth) {
      result.warnings?.push(`JSON depth (${analysis.depth}) exceeds recommended limit (${maxDepth})`)
    }

    if (analysis.nodeCount > maxNodes) {
      result.warnings?.push(`Node count (${analysis.nodeCount}) exceeds limit (${maxNodes})`)
      if (strict) {
        result.errors?.push('Too many nodes for processing')
        result.metadata.isValid = false
      }
    }

  } catch (error) {
    result.errors?.push(`JSON Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  result.metadata.parseTime = performance.now() - startTime
  return result
}

export function isValidJsonSyntax(jsonString: string): boolean {
  if (!jsonString || typeof jsonString !== 'string') {
    return false
  }

  const trimmed = jsonString.trim()
  if (!trimmed) {
    return false
  }

  // Check basic JSON structure
  const firstChar = trimmed[0]
  const lastChar = trimmed[trimmed.length - 1]

  if (
    (firstChar === '{' && lastChar === '}') ||
    (firstChar === '[' && lastChar === ']') ||
    (firstChar === '"' && lastChar === '"') ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    trimmed === 'null' ||
    !isNaN(Number(trimmed))
  ) {
    try {
      JSON.parse(trimmed)
      return true
    } catch {
      return false
    }
  }

  return false
}

export function analyzeJsonStructure(
  data: any, 
  maxDepth: number = 100, 
  maxNodes: number = 10000
): {
  depth: number
  nodeCount: number
  type: string
  hasCircularReferences: boolean
} {
  let depth = 0
  let nodeCount = 0
  const visited = new WeakSet()

  function traverse(obj: any, currentDepth: number = 0): void {
    if (nodeCount >= maxNodes) return
    if (currentDepth > maxDepth) return

    nodeCount++
    depth = Math.max(depth, currentDepth)

    if (obj && typeof obj === 'object') {
      if (visited.has(obj)) {
        return // Circular reference detected
      }
      visited.add(obj)

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length && nodeCount < maxNodes; i++) {
          traverse(obj[i], currentDepth + 1)
        }
      } else {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && nodeCount < maxNodes) {
            traverse(obj[key], currentDepth + 1)
          }
        }
      }
    }
  }

  traverse(data)

  return {
    depth,
    nodeCount,
    type: getJsonType(data),
    hasCircularReferences: false // Will be enhanced in future versions
  }
}

export function getJsonType(data: any): string {
  if (data === null) return 'null'
  if (Array.isArray(data)) return 'array'
  if (typeof data === 'object') return 'object'
  if (typeof data === 'string') return 'string'
  if (typeof data === 'number') return 'number'
  if (typeof data === 'boolean') return 'boolean'
  return 'unknown'
}

export function formatJsonString(
  data: any, 
  indent: number = 2, 
  maxLength?: number
): string {
  try {
    const formatted = JSON.stringify(data, null, indent)
    
    if (maxLength && formatted.length > maxLength) {
      return formatted.substring(0, maxLength) + '...'
    }
    
    return formatted
  } catch (error) {
    throw new Error(`Failed to format JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validateJsonSchema(data: any, schema?: any): ValidationResult {
  // Basic validation - will be enhanced with proper schema validation later
  return {
    isValid: data !== undefined && data !== null,
    errors: [],
    warnings: []
  }
}

export function extractJsonPaths(data: any): string[] {
  const paths: string[] = []

  function traverse(obj: any, currentPath: string = ''): void {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const path = currentPath ? `${currentPath}[${index}]` : `[${index}]`
          paths.push(path)
          traverse(item, path)
        })
      } else {
        Object.keys(obj).forEach(key => {
          const path = currentPath ? `${currentPath}.${key}` : key
          paths.push(path)
          traverse(obj[key], path)
        })
      }
    }
  }

  traverse(data)
  return paths
}

export function searchInJson(
  data: any, 
  query: string, 
  caseSensitive: boolean = false
): Array<{
  path: string
  value: any
  type: string
}> {
  const results: Array<{
    path: string
    value: any
    type: string
  }> = []

  const searchTerm = caseSensitive ? query : query.toLowerCase()

  function traverse(obj: any, currentPath: string = ''): void {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const path = currentPath ? `${currentPath}[${index}]` : `[${index}]`
          traverse(item, path)
        })
      } else {
        Object.keys(obj).forEach(key => {
          const path = currentPath ? `${currentPath}.${key}` : key
          const keyMatch = caseSensitive ? key : key.toLowerCase()
          
          if (keyMatch.includes(searchTerm)) {
            results.push({
              path,
              value: obj[key],
              type: getJsonType(obj[key])
            })
          }
          
          traverse(obj[key], path)
        })
      }
    } else {
      const stringValue = String(obj)
      const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase()
      
      if (searchValue.includes(searchTerm)) {
        results.push({
          path: currentPath,
          value: obj,
          type: getJsonType(obj)
        })
      }
    }
  }

  traverse(data)
  return results
}