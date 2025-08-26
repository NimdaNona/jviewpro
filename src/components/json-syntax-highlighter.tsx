"use client"

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SyntaxHighlighterProps {
  code: string
  language?: 'json' | 'javascript' | 'text'
  showLineNumbers?: boolean
  maxLines?: number
  className?: string
}

interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace' | 'error'
  value: string
  line: number
  column: number
}

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = []
  let line = 1
  let column = 1
  let i = 0

  const addToken = (type: Token['type'], value: string) => {
    tokens.push({ type, value, line, column })
    
    // Update position tracking
    for (const char of value) {
      if (char === '\n') {
        line++
        column = 1
      } else {
        column++
      }
    }
  }

  while (i < code.length) {
    const char = code[i]

    // Whitespace
    if (/\s/.test(char)) {
      let whitespace = ''
      while (i < code.length && /\s/.test(code[i])) {
        whitespace += code[i]
        i++
      }
      addToken('whitespace', whitespace)
      continue
    }

    // String (including keys)
    if (char === '"') {
      let string = '"'
      i++
      let escaped = false
      
      while (i < code.length) {
        const currentChar = code[i]
        string += currentChar
        
        if (escaped) {
          escaped = false
        } else if (currentChar === '\\') {
          escaped = true
        } else if (currentChar === '"') {
          i++
          break
        }
        i++
      }
      
      // Determine if this is a key (followed by colon after whitespace)
      let j = i
      while (j < code.length && /\s/.test(code[j])) {
        j++
      }
      
      const isKey = j < code.length && code[j] === ':'
      addToken(isKey ? 'key' : 'string', string)
      continue
    }

    // Numbers
    if (/[\d\-]/.test(char)) {
      let number = ''
      
      // Handle negative sign
      if (char === '-') {
        number += char
        i++
      }
      
      // Integer part
      while (i < code.length && /\d/.test(code[i])) {
        number += code[i]
        i++
      }
      
      // Decimal part
      if (i < code.length && code[i] === '.') {
        number += code[i]
        i++
        while (i < code.length && /\d/.test(code[i])) {
          number += code[i]
          i++
        }
      }
      
      // Exponential part
      if (i < code.length && /[eE]/.test(code[i])) {
        number += code[i]
        i++
        if (i < code.length && /[+\-]/.test(code[i])) {
          number += code[i]
          i++
        }
        while (i < code.length && /\d/.test(code[i])) {
          number += code[i]
          i++
        }
      }
      
      addToken('number', number)
      continue
    }

    // Boolean and null
    if (char === 't' && code.slice(i, i + 4) === 'true') {
      addToken('boolean', 'true')
      i += 4
      continue
    }
    
    if (char === 'f' && code.slice(i, i + 5) === 'false') {
      addToken('boolean', 'false')
      i += 5
      continue
    }
    
    if (char === 'n' && code.slice(i, i + 4) === 'null') {
      addToken('null', 'null')
      i += 4
      continue
    }

    // Punctuation
    if (/[{}[\]:,]/.test(char)) {
      addToken('punctuation', char)
      i++
      continue
    }

    // Unrecognized character
    addToken('error', char)
    i++
  }

  return tokens
}

function getTokenClassName(type: Token['type']): string {
  switch (type) {
    case 'key':
      return 'text-red-600 dark:text-red-400 font-medium'
    case 'string':
      return 'text-green-600 dark:text-green-400'
    case 'number':
      return 'text-blue-600 dark:text-blue-400'
    case 'boolean':
      return 'text-purple-600 dark:text-purple-400 font-medium'
    case 'null':
      return 'text-gray-500 dark:text-gray-400 font-medium'
    case 'punctuation':
      return 'text-gray-700 dark:text-gray-300'
    case 'error':
      return 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    default:
      return ''
  }
}

export function JsonSyntaxHighlighter({
  code,
  language = 'json',
  showLineNumbers = true,
  maxLines,
  className
}: SyntaxHighlighterProps) {
  const { tokens, lineCount } = useMemo(() => {
    if (language !== 'json') {
      // For non-JSON, just return the code as-is
      const lines = code.split('\n')
      return {
        tokens: [{ type: 'whitespace' as const, value: code, line: 1, column: 1 }],
        lineCount: lines.length
      }
    }

    const tokens = tokenizeJson(code)
    const lineCount = Math.max(1, ...tokens.map(t => t.line))
    
    return { tokens, lineCount }
  }, [code, language])

  const displayTokens = useMemo(() => {
    if (!maxLines) return tokens

    return tokens.filter(token => token.line <= maxLines)
  }, [tokens, maxLines])

  const lineNumbers = useMemo(() => {
    const totalLines = maxLines ? Math.min(lineCount, maxLines) : lineCount
    return Array.from({ length: totalLines }, (_, i) => i + 1)
  }, [lineCount, maxLines])

  if (language !== 'json') {
    return (
      <div className={cn('font-mono text-sm overflow-auto', className)}>
        <div className="flex">
          {showLineNumbers && (
            <div className="flex-shrink-0 pr-4 text-muted-foreground border-r mr-4 select-none">
              {lineNumbers.map(num => (
                <div key={num} className="text-right leading-6">
                  {num}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <pre className="leading-6 whitespace-pre-wrap break-words">
              {code}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('font-mono text-sm overflow-auto', className)}>
      <div className="flex">
        {showLineNumbers && (
          <div className="flex-shrink-0 pr-4 text-muted-foreground border-r mr-4 select-none">
            {lineNumbers.map(num => (
              <div key={num} className="text-right leading-6">
                {num}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <pre className="leading-6 whitespace-pre-wrap break-words">
            {displayTokens.map((token, index) => (
              <span
                key={index}
                className={cn(
                  getTokenClassName(token.type),
                  token.type === 'whitespace' && 'whitespace-pre'
                )}
              >
                {token.value}
              </span>
            ))}
          </pre>
        </div>
      </div>
      
      {maxLines && lineCount > maxLines && (
        <div className="mt-2 text-center text-sm text-muted-foreground italic border-t pt-2">
          ... {lineCount - maxLines} more lines (showing first {maxLines} lines)
        </div>
      )}
    </div>
  )
}

export function CodeBlock({
  code,
  language = 'json',
  title,
  copyable = true,
  collapsible = false,
  maxHeight = '400px',
  className
}: {
  code: string
  language?: 'json' | 'javascript' | 'text'
  title?: string
  copyable?: boolean
  collapsible?: boolean
  maxHeight?: string
  className?: string
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {(title || copyable) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
          {title && (
            <h4 className="text-sm font-medium">{title}</h4>
          )}
          
          {copyable && (
            <button
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Copy
            </button>
          )}
        </div>
      )}
      
      <div 
        className="p-4 bg-muted/30 overflow-auto"
        style={{ maxHeight }}
      >
        <JsonSyntaxHighlighter
          code={code}
          language={language}
          showLineNumbers={true}
        />
      </div>
    </div>
  )
}