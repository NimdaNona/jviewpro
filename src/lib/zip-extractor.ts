import JSZip from 'jszip'
import { FileData } from '@/types'

export interface ZipExtractionOptions {
  maxFileSize?: number
  maxFiles?: number
  supportedExtensions?: string[]
  onProgress?: (progress: number, current: string) => void
}

export interface ZipExtractionResult {
  files: FileData[]
  errors: string[]
  warnings: string[]
  totalExtracted: number
  totalSkipped: number
}

const DEFAULT_OPTIONS: Required<ZipExtractionOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 50,
  supportedExtensions: ['.json', '.txt'],
  onProgress: () => {}
}

export async function extractZipFile(
  file: File,
  options: ZipExtractionOptions = {}
): Promise<ZipExtractionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const result: ZipExtractionResult = {
    files: [],
    errors: [],
    warnings: [],
    totalExtracted: 0,
    totalSkipped: 0
  }

  try {
    // Load the ZIP file
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)

    // Get all files in the ZIP
    const zipFiles = Object.keys(zipContent.files)
      .map(name => zipContent.files[name])
      .filter(zipFile => !zipFile.dir) // Skip directories
      .slice(0, opts.maxFiles) // Limit number of files

    if (zipFiles.length === 0) {
      result.warnings.push('ZIP file contains no extractable files')
      return result
    }

    if (Object.keys(zipContent.files).length > opts.maxFiles) {
      result.warnings.push(`ZIP contains ${Object.keys(zipContent.files).length} files, only processing first ${opts.maxFiles}`)
    }

    // Process each file
    for (let i = 0; i < zipFiles.length; i++) {
      const zipFile = zipFiles[i]
      const fileName = zipFile.name
      
      opts.onProgress(((i + 1) / zipFiles.length) * 100, fileName)

      try {
        // Check file extension
        const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase()
        if (!opts.supportedExtensions.includes(fileExtension)) {
          result.totalSkipped++
          result.warnings.push(`Skipped ${fileName}: Unsupported file type`)
          continue
        }

        // Extract file content
        const content = await zipFile.async('string')
        
        // Check actual content size
        if (content.length > opts.maxFileSize) {
          result.totalSkipped++
          result.warnings.push(`Skipped ${fileName}: Extracted content too large (${Math.round(content.length / (1024 * 1024))}MB)`)
          continue
        }

        if (content.length === 0) {
          result.totalSkipped++
          result.warnings.push(`Skipped ${fileName}: File is empty`)
          continue
        }

        // Create FileData object
        const extractedFile: FileData = {
          name: fileName,
          size: content.length,
          type: fileExtension,
          content: content,
          lastModified: zipFile.date?.getTime() || Date.now(),
          extractedFrom: file.name
        }

        result.files.push(extractedFile)
        result.totalExtracted++

      } catch (error) {
        result.totalSkipped++
        result.errors.push(`Failed to extract ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Final validation
    if (result.files.length === 0 && result.errors.length === 0) {
      result.warnings.push('No compatible files found in ZIP archive')
    }

  } catch (error) {
    result.errors.push(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

export function isZipFile(file: File): boolean {
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip-compressed' || 
         file.name.toLowerCase().endsWith('.zip')
}

export function getZipExtractionSummary(result: ZipExtractionResult): string {
  const parts = []
  
  if (result.totalExtracted > 0) {
    parts.push(`${result.totalExtracted} file${result.totalExtracted === 1 ? '' : 's'} extracted`)
  }
  
  if (result.totalSkipped > 0) {
    parts.push(`${result.totalSkipped} skipped`)
  }
  
  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`)
  }
  
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`)
  }
  
  return parts.join(', ') || 'No files processed'
}