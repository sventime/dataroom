'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDataroomStore } from '@/store/dataroom-store'
import { MAX_FILE_SIZE, formatFileSize } from '@/lib/constants'
import { Loader2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

interface FileUploadConflictDialogProps {
  files: File[]
  parentId?: string
  onComplete: () => void
  open?: boolean
  onProgressUpdate?: (
    progress: number,
    status: 'preparing' | 'uploading' | 'complete' | 'error',
  ) => void
}

interface FileConflict {
  file: File
  type: 'name' | 'size'
  suggestedName: string
  finalName: string
  reason?: string
}

export function FileUploadConflictDialog({
  files,
  parentId,
  onComplete,
  open: externalOpen = false,
  onProgressUpdate,
}: FileUploadConflictDialogProps) {
  const [open, setOpen] = useState(false)
  const [conflicts, setConflicts] = useState<FileConflict[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [skippedFiles, setSkippedFiles] = useState<Set<File>>(new Set())
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<
    'preparing' | 'uploading' | 'complete' | 'error'
  >('preparing')
  const { uploadFiles, nodes, currentFolderId, operationLoading } = useDataroomStore()
  const uploadExecutedRef = useRef<Set<string>>(new Set())

  // Only reset upload key when dialog closes AND files are cleared (true completion)
  useEffect(() => {
    if (!externalOpen && files.length === 0) {
      uploadExecutedRef.current.clear()
    }
  }, [externalOpen, files.length])

  // Create stable upload key using useMemo
  const uploadKey = useMemo(() => {
    if (files.length === 0) return ''
    return `${files.length}-${files.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join('|')}`
  }, [files])

  useEffect(() => {
    if (!externalOpen || files.length === 0 || !uploadKey) return

    // If we already processed this exact batch, skip
    if (uploadExecutedRef.current.has(uploadKey)) {
      return
    }

    uploadExecutedRef.current.add(uploadKey) // Mark this batch as being processed

    const simulateProgress = (
      startProgress: number,
      endProgress: number,
      duration: number,
      status: 'preparing' | 'uploading' | 'complete' | 'error' = 'uploading',
    ) => {
      const steps = 20
      const increment = (endProgress - startProgress) / steps
      const stepDuration = duration / steps

      let currentProgress = startProgress
      const interval = setInterval(() => {
        currentProgress += increment
        const progress = Math.min(currentProgress, endProgress)
        if (currentProgress >= endProgress) {
          setUploadProgress(endProgress)
          onProgressUpdate?.(endProgress, status)
          clearInterval(interval)
        } else {
          setUploadProgress(progress)
          onProgressUpdate?.(progress, status)
        }
      }, stepDuration)

      return interval
    }

    const checkConflictsAndUpload = async () => {
      try {
        setIsUploading(true)
        setUploadStatus('preparing')
        setUploadProgress(0)
        onProgressUpdate?.(0, 'preparing')

        // Simulate preparation progress
        const prepInterval = simulateProgress(0, 15, 500, 'preparing')
        await new Promise((resolve) => setTimeout(resolve, 600))
        clearInterval(prepInterval)

        const targetParentId = parentId || currentFolderId

        const existingFiles = Object.values(nodes)
          .filter((node) => node.parentId === targetParentId && node.type === 'file')
          .map((node) => node.name)

        
        // Check for both name conflicts and size violations
        const nameConflicts = files.filter((file) => existingFiles.includes(file.name))
        const sizeViolations = files.filter((file) => file.size > MAX_FILE_SIZE)
        
        // Combine all conflicts
        const allConflicts: FileConflict[] = []
        
        // Add name conflicts
        nameConflicts.forEach((file) => {
          const nameParts = file.name.split('.')
          const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : ''
          const baseName = nameParts.join('.')

          // Find the next available number
          let counter = 1
          let suggestedName = `${baseName} (${counter})${extension}`

          while (existingFiles.includes(suggestedName)) {
            counter++
            suggestedName = `${baseName} (${counter})${extension}`
          }

          allConflicts.push({
            file,
            type: 'name',
            suggestedName,
            finalName: suggestedName,
          })
        })
        
        // Add size violations
        sizeViolations.forEach((file) => {
          // Don't duplicate if file already has name conflict
          if (!nameConflicts.includes(file)) {
            allConflicts.push({
              file,
              type: 'size',
              suggestedName: file.name,
              finalName: file.name,
              reason: `File size (${formatFileSize(file.size)}) exceeds 5MB limit`
            })
          }
        })

        // Conflict analysis completed

        if (allConflicts.length > 0) {
          const fileConflicts = allConflicts

          setConflicts(fileConflicts)
          setCurrentIndex(0)
          setFileName(fileConflicts[0].suggestedName)
          setOpen(true)

          // Filter out files that have any type of conflict
          const conflictingFiles = allConflicts.map(c => c.file)
          const nonConflictingFiles = files.filter(
            (file) => !conflictingFiles.includes(file) && file.size <= MAX_FILE_SIZE,
          )
          if (nonConflictingFiles.length > 0) {
            setUploadStatus('uploading')
            setUploadProgress(20)

            // Simulate upload progress
            const uploadInterval = simulateProgress(20, 95, 2000, 'uploading')

            const apiParentId = targetParentId === 'root' ? null : targetParentId
            await uploadFiles(nonConflictingFiles, apiParentId || undefined)

            clearInterval(uploadInterval)
            setUploadProgress(100)
            onProgressUpdate?.(100, 'complete')
          }

          return
        }

        // No conflicts detected, check file sizes and upload valid files
        const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE)
        
        if (validFiles.length === 0) {
          setUploadStatus('error')
          setError('All files exceed the 5MB size limit')
          onProgressUpdate?.(0, 'error')
          setOpen(true)
          return
        }
        
        setUploadStatus('uploading')
        setUploadProgress(20)

        // Simulate upload progress for valid files
        const totalFiles = validFiles.length
        const progressPerFile = 75 / totalFiles // Leave 20% for prep, 5% for completion

        const uploadInterval = simulateProgress(
          20,
          95,
          Math.max(1000, totalFiles * 500),
          'uploading',
        )

        const apiParentId = targetParentId === 'root' ? null : targetParentId
        await uploadFiles(validFiles, apiParentId || undefined)

        clearInterval(uploadInterval)
        setUploadProgress(100)
        setUploadStatus('complete')
        onProgressUpdate?.(100, 'complete')

        // Show completion state briefly before closing
        await new Promise((resolve) => setTimeout(resolve, 800))
        onComplete()

        // Keep upload key until component fully unmounts/files cleared to prevent re-upload
        // Don't reset uploadExecutedRef here - let the parent component state change handle it
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setUploadStatus('error')
        setError(errorMessage)
        toast('Upload failed', {
          description: errorMessage
        })
        onProgressUpdate?.(0, 'error')
        setOpen(true)
      } finally {
        setIsUploading(false)
      }
    }

    checkConflictsAndUpload()
  }, [externalOpen, uploadKey])

  // Component render tracking removed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const currentConflict = conflicts[currentIndex]
    
    // Size conflicts can only be skipped, not resolved
    if (currentConflict.type === 'size') {
      handleSkip()
      return
    }

    const trimmedName = fileName.trim()
    if (!trimmedName) return

    const targetParentId = parentId || currentFolderId

    // Get existing files in the folder
    const existingFiles = Object.values(nodes)
      .filter((node) => node.parentId === targetParentId && node.type === 'file')
      .map((node) => node.name)

    // Get already resolved conflict names
    const resolvedNames = conflicts
      .slice(0, currentIndex)
      .map((conflict) => conflict.finalName)

    // Check if name conflicts with existing files or already resolved names
    if (existingFiles.includes(trimmedName) || resolvedNames.includes(trimmedName)) {
      setError('A file with this name already exists or has been used')
      return
    }

    // Update the conflict with the final name
    const updatedConflicts = [...conflicts]
    updatedConflicts[currentIndex].finalName = trimmedName

    if (currentIndex < conflicts.length - 1) {
      // Move to next conflict
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setFileName(updatedConflicts[nextIndex].suggestedName)
      setError('')
      setConflicts(updatedConflicts)
    } else {
      setOpen(false)
      await uploadResolvedConflicts(updatedConflicts)
    }
  }

  const uploadResolvedConflicts = async (resolvedConflicts: FileConflict[]) => {
    try {
      const targetParentId = parentId || currentFolderId

      const filesToUpload = resolvedConflicts
        .filter((conflict) => 
          !skippedFiles.has(conflict.file) && 
          conflict.type === 'name' && // Only upload name conflicts that were resolved
          conflict.file.size <= MAX_FILE_SIZE // Double-check size limit
        )
        .map(
          (conflict) =>
            new File([conflict.file], conflict.finalName, {
              type: conflict.file.type,
              lastModified: conflict.file.lastModified,
            }),
        )

      if (filesToUpload.length > 0) {
        const apiParentId = targetParentId === 'root' ? null : targetParentId
        await uploadFiles(filesToUpload, apiParentId || undefined)
      }
    } catch (error) {
      console.error('Error uploading resolved conflicts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      toast('Upload failed', {
        description: errorMessage
      })
      setOpen(true)
      return
    }

    onComplete()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value)
    if (error) setError('')
  }

  const handleSkip = async () => {
    const currentFile = conflicts[currentIndex].file

    // Mark current file as skipped
    setSkippedFiles((prev) => new Set(prev.add(currentFile)))

    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFileName(conflicts[currentIndex + 1].suggestedName)
      setError('')
    } else {
      setOpen(false)
      await uploadResolvedConflicts(conflicts)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    onComplete()
  }

  // No longer show progress overlay - use main page drag card instead

  if (!open || conflicts.length === 0) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent />
      </Dialog>
    )
  }

  const currentConflict = conflicts[currentIndex]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {currentConflict.type === 'size' ? 'File Size Limit Exceeded' : 'File Name Conflict'}{' '}
              {conflicts.length > 1 && ` (${currentIndex + 1} of ${conflicts.length})`}
            </DialogTitle>
            <DialogDescription>
              {currentConflict.type === 'size' 
                ? currentConflict.reason
                : `A file named "${currentConflict.file.name}" already exists.`
              }
            </DialogDescription>
          </DialogHeader>
          {currentConflict.type === 'name' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Input
                  value={fileName}
                  onChange={handleNameChange}
                  placeholder="Enter new file name..."
                  autoFocus
                  className={error ? 'border-destructive' : ''}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          )}
          {currentConflict.type === 'size' && (
            <div className="grid gap-4 py-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  File too large: {currentConflict.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(currentConflict.file.size)} (limit: 5MB)
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={handleSkip}>
              Skip This File
            </Button>
            {currentConflict.type === 'name' && (
              <Button
                type="submit"
                disabled={!fileName.trim() || operationLoading.uploadFiles}
              >
                {operationLoading.uploadFiles ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {operationLoading.uploadFiles
                  ? 'Uploading...'
                  : currentIndex < conflicts.length - 1
                    ? 'Next'
                    : 'Upload'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
