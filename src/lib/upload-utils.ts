import { MAX_FILE_SIZE, formatFileSize } from '@/lib/constants'

export type ConflictType = 'name' | 'size'
export type UploadStatus = 'preparing' | 'uploading' | 'complete' | 'error'

export interface FileConflict {
  file: File
  type: ConflictType
  suggestedName: string
  finalName: string
  reason?: string
}

export function detectFileConflicts(
  files: File[],
  existingFiles: string[]
): FileConflict[] {
  const allConflicts: FileConflict[] = []

  // Check for size violations FIRST - these take priority
  const sizeViolations = files.filter((file) => file.size > MAX_FILE_SIZE)
  sizeViolations.forEach((file) => {
    allConflicts.push({
      file,
      type: 'size',
      suggestedName: file.name,
      finalName: file.name,
      reason: `File size (${formatFileSize(file.size)}) exceeds 5MB limit`,
    })
  })

  // Check for name conflicts only for files that don't have size violations
  const filesWithoutSizeIssues = files.filter((file) => file.size <= MAX_FILE_SIZE)
  const nameConflicts = filesWithoutSizeIssues.filter((file) => existingFiles.includes(file.name))
  nameConflicts.forEach((file) => {
    const suggestedName = generateUniqueFileName(file.name, existingFiles)
    allConflicts.push({
      file,
      type: 'name',
      suggestedName,
      finalName: suggestedName,
    })
  })

  return allConflicts
}

export function generateUniqueFileName(
  originalName: string,
  existingFiles: string[]
): string {
  const nameParts = originalName.split('.')
  const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : ''
  const baseName = nameParts.join('.')

  let counter = 1
  let suggestedName = `${baseName} (${counter})${extension}`

  while (existingFiles.includes(suggestedName)) {
    counter++
    suggestedName = `${baseName} (${counter})${extension}`
  }

  return suggestedName
}

export function validateFileName(
  fileName: string,
  existingFiles: string[],
  resolvedNames: string[]
): string | null {
  const trimmedName = fileName.trim()
  if (!trimmedName) return 'File name cannot be empty'

  if (existingFiles.includes(trimmedName) || resolvedNames.includes(trimmedName)) {
    return 'A file with this name already exists or has been used'
  }

  return null
}

export function getValidFiles(files: File[]): File[] {
  return files.filter((file) => file.size <= MAX_FILE_SIZE)
}