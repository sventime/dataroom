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
import { Loader2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  suggestedName: string
  finalName: string
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

        const conflictingFiles = files.filter((file) => existingFiles.includes(file.name))

        // Conflict analysis completed

        if (conflictingFiles.length > 0) {
          const fileConflicts: FileConflict[] = conflictingFiles.map((file) => {
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

            return {
              file,
              suggestedName,
              finalName: suggestedName,
            }
          })

          setConflicts(fileConflicts)
          setCurrentIndex(0)
          setFileName(fileConflicts[0].suggestedName)
          setOpen(true)

          const nonConflictingFiles = files.filter(
            (file) => !conflictingFiles.includes(file),
          )
          if (nonConflictingFiles.length > 0) {
            setUploadStatus('uploading')
            setUploadProgress(20)

            // Simulate upload progress
            const uploadInterval = simulateProgress(20, 95, 2000, 'uploading')

            const apiParentId = targetParentId === 'root' ? null : targetParentId
            await uploadFiles(nonConflictingFiles, apiParentId)

            clearInterval(uploadInterval)
            setUploadProgress(100)
            onProgressUpdate?.(100, 'complete')
          }

          return
        }

        // No conflicts detected, upload all files
        setUploadStatus('uploading')
        setUploadProgress(20)

        // Simulate upload progress for all files
        const totalFiles = files.length
        const progressPerFile = 75 / totalFiles // Leave 20% for prep, 5% for completion

        const uploadInterval = simulateProgress(
          20,
          95,
          Math.max(1000, totalFiles * 500),
          'uploading',
        )

        const apiParentId = targetParentId === 'root' ? null : targetParentId
        await uploadFiles(files, apiParentId)

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
        setUploadStatus('error')
        setError(error instanceof Error ? error.message : 'Upload failed')
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
        .filter((conflict) => !skippedFiles.has(conflict.file))
        .map(
          (conflict) =>
            new File([conflict.file], conflict.finalName, {
              type: conflict.file.type,
              lastModified: conflict.file.lastModified,
            }),
        )

      if (filesToUpload.length > 0) {
        const apiParentId = targetParentId === 'root' ? null : targetParentId
        await uploadFiles(filesToUpload, apiParentId)
      }
    } catch (error) {
      console.error('Error uploading resolved conflicts:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
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
              File Name Conflict{' '}
              {conflicts.length > 1 && ` (${currentIndex + 1} of ${conflicts.length})`}
            </DialogTitle>
            <DialogDescription>
              A file named &quot;{currentConflict.file.name}&quot; already exists.
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={handleSkip}>
              Skip This File
            </Button>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
