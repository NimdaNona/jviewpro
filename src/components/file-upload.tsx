"use client"

import { useState, useRef, useCallback } from 'react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { Upload, FileText, AlertCircle, CheckCircle, Archive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { FileData } from '@/types'
import { FILE_LIMITS } from '@/config/constants'
import { extractZipFile, isZipFile, getZipExtractionSummary } from '@/lib/zip-extractor'

interface FileUploadProps {
  onFileSelect: (files: FileData[]) => void
  onError: (error: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
}

export function FileUpload({
  onFileSelect,
  onError,
  maxFiles = 10,
  acceptedTypes = ['.json', '.txt', '.zip'],
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionStatus, setExtractionStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { handleError } = useErrorHandler({ showToast: false })

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    setIsProcessing(true)
    setExtractionProgress(0)
    setExtractionStatus('')
    const processedFiles: FileData[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i]
        setExtractionStatus(`Processing ${file.name}...`)

        // Check if it's a ZIP file
        if (isZipFile(file)) {
          try {
            const extractionResult = await extractZipFile(file, {
              maxFileSize: FILE_LIMITS.maxSizeBytes,
              maxFiles: maxFiles - processedFiles.length,
              supportedExtensions: ['.json', '.txt'],
              onProgress: (progress, currentFile) => {
                setExtractionProgress(progress)
                setExtractionStatus(`Extracting: ${currentFile}`)
              }
            })

            processedFiles.push(...extractionResult.files)
            errors.push(...extractionResult.errors)
            warnings.push(...extractionResult.warnings)

            const summary = getZipExtractionSummary(extractionResult)
            setExtractionStatus(`ZIP processed: ${summary}`)

          } catch (error) {
            const err = handleError(error, `extracting ZIP file ${file.name}`)
            errors.push(`${file.name}: ${err.message}`)
          }
          continue
        }

        // Regular file processing
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        
        // Validate file type
        if (!acceptedTypes.includes(fileExtension)) {
          errors.push(`${file.name}: Unsupported file type. Supported: ${acceptedTypes.join(', ')}`)
          continue
        }

        // Validate file size
        if (file.size > FILE_LIMITS.maxSizeBytes) {
          errors.push(`${file.name}: File too large. Maximum size: ${FILE_LIMITS.maxSizeBytes / (1024 * 1024)}MB`)
          continue
        }

        if (file.size === 0) {
          errors.push(`${file.name}: File is empty`)
          continue
        }

        // Read file content
        try {
          const content = await readFileContent(file)
          processedFiles.push({
            name: file.name,
            size: file.size,
            type: fileExtension,
            content,
            lastModified: file.lastModified
          })
        } catch (error) {
          const err = handleError(error, `reading file ${file.name}`)
          errors.push(`${file.name}: ${err.message}`)
        }
      }

      if (files.length > maxFiles) {
        errors.push(`Only the first ${maxFiles} files were processed`)
      }

      if (processedFiles.length > 0) {
        onFileSelect(processedFiles)
      }

      const allMessages = [...errors, ...warnings]
      if (allMessages.length > 0) {
        onError(allMessages.join('; '))
      }

    } catch (error) {
      const err = handleError(error, 'file processing')
      onError(`Processing failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
      setExtractionProgress(0)
      setExtractionStatus('')
    }
  }, [onFileSelect, onError, maxFiles, acceptedTypes, handleError])

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          resolve(content)
        } else {
          reject(new Error('Failed to read file as text'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('File reading failed'))
      }
      
      reader.readAsText(file)
    })
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFiles])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer border-2 border-dashed',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
        isProcessing && 'pointer-events-none opacity-50',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className={cn(
          'mb-4 rounded-full p-4 transition-colors',
          isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {isProcessing ? (
            <LoadingSpinner size="lg" />
          ) : (
            <Upload className={cn(
              'size-8',
              isDragging ? 'text-primary-foreground' : 'text-muted-foreground'
            )} />
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-lg font-semibold">
            {isProcessing ? 'Processing files...' : 'Drop your files here'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse your computer
          </p>
        </div>

        {isProcessing && extractionStatus && (
          <div className="mb-4 w-full max-w-sm">
            <Progress 
              value={extractionProgress} 
              showLabel={true}
              label={extractionStatus}
              size="sm"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Supported: {acceptedTypes.join(', ')}</p>
          <p>Max {maxFiles} files, {FILE_LIMITS.maxSizeBytes / (1024 * 1024)}MB each</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          <FileText className="size-4 mr-2" />
          Browse Files
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}

export function FileUploadStatus({ 
  files, 
  onRemove 
}: { 
  files: FileData[]
  onRemove?: (index: number) => void 
}) {
  if (files.length === 0) return null

  return (
    <Card className="mt-4">
      <CardContent className="py-4">
        <h4 className="text-sm font-medium mb-3">Uploaded Files ({files.length})</h4>
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • {file.type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.extractedFrom && (
                  <div title={`Extracted from ${file.extractedFrom}`}>
                    <Archive className="size-3 text-blue-500" />
                  </div>
                )}
                
                {file.parsedData ? (
                  <CheckCircle className="size-4 text-green-500" />
                ) : (
                  <AlertCircle className="size-4 text-yellow-500" />
                )}
                
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}