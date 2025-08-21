'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useDataroomStore } from '@/store/dataroom-store'
import { ConflictForm } from '../forms/conflict-form'
import {
  FileConflict,
  UploadStatus,
  detectFileConflicts,
  validateFileName,
  getValidFiles,
} from '@/lib/upload-utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FileUploadConflictDialogProps {
  files: File[]
  parentId?: string
  onComplete: () => void
  open?: boolean
  onProgressUpdate?: (progress: number, status: UploadStatus) => void
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
  const [processedBatches, setProcessedBatches] = useState<Set<string>>(new Set())
  const { uploadFiles, nodes, currentFolderId, operationLoading } = useDataroomStore()

  // Generate unique batch ID for this file set - include timestamp to allow re-uploads
  const batchId = files.length > 0 
    ? `${files.length}-${files.map(f => `${f.name}-${f.size}-${f.lastModified}`).join('|')}`
    : null

  // Reset state when dialog closes
  useEffect(() => {
    if (!externalOpen) {
      setOpen(false)
      setConflicts([])
      setCurrentIndex(0)
      setFileName('')
      setError('')
      setSkippedFiles(new Set())
    }
  }, [externalOpen])

  useEffect(() => {
    if (!externalOpen || !batchId || processedBatches.has(batchId)) return

    const handleUpload = async () => {
      try {
        setProcessedBatches(prev => new Set([...prev, batchId]))
        onProgressUpdate?.(0, 'preparing')
        
        const targetParentId = parentId || currentFolderId
        const existingFiles = Object.values(nodes)
          .filter((node) => node.parentId === targetParentId && node.type === 'file')
          .map((node) => node.name)

        const detectedConflicts = detectFileConflicts(files, existingFiles)
        
        if (detectedConflicts.length > 0) {
          setConflicts(detectedConflicts)
          setCurrentIndex(0)
          setFileName(detectedConflicts[0].suggestedName)
          setOpen(true)

          // Upload files without conflicts
          const conflictingFiles = detectedConflicts.map(c => c.file)
          const validFiles = getValidFiles(files.filter(f => !conflictingFiles.includes(f)))
          
          if (validFiles.length > 0) {
            onProgressUpdate?.(50, 'uploading')
            const apiParentId = targetParentId === 'root' ? null : targetParentId
            await uploadFiles(validFiles, apiParentId || undefined)
            onProgressUpdate?.(100, 'complete')
          } else {
            // No valid files to upload alongside conflicts
            onProgressUpdate?.(100, 'complete')
          }
        } else {
          // No conflicts - upload all valid files
          const validFiles = getValidFiles(files)
          
          if (validFiles.length === 0) {
            setError('All files exceed the 5MB size limit')
            setOpen(true)
            onProgressUpdate?.(0, 'error')
            return
          }

          onProgressUpdate?.(50, 'uploading')
          const apiParentId = targetParentId === 'root' ? null : targetParentId
          await uploadFiles(validFiles, apiParentId || undefined)
          onProgressUpdate?.(100, 'complete')
          
          setTimeout(() => {
            // Clear processed batch when upload completes successfully
            setProcessedBatches(prev => {
              const newSet = new Set(prev)
              if (batchId) newSet.delete(batchId)
              return newSet
            })
            onComplete()
          }, 800)
        }
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setError(errorMessage)
        toast('Upload failed', { description: errorMessage })
        onProgressUpdate?.(0, 'error')
        setOpen(true)
      }
    }

    handleUpload()
  }, [externalOpen, batchId, processedBatches, files, parentId, currentFolderId, nodes, uploadFiles, onProgressUpdate, onComplete])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const currentConflict = conflicts[currentIndex]
    if (currentConflict.type === 'size' || currentConflict.type === 'type') {
      handleSkip()
      return
    }

    const targetParentId = parentId || currentFolderId
    const existingFiles = Object.values(nodes)
      .filter((node) => node.parentId === targetParentId && node.type === 'file')
      .map((node) => node.name)
    
    const resolvedNames = conflicts
      .slice(0, currentIndex)
      .map((conflict) => conflict.finalName)

    const validationError = validateFileName(fileName, existingFiles, resolvedNames)
    if (validationError) {
      setError(validationError)
      return
    }

    const updatedConflicts = [...conflicts]
    updatedConflicts[currentIndex].finalName = fileName.trim()
    setConflicts(updatedConflicts)

    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFileName(updatedConflicts[currentIndex + 1].suggestedName)
      setError('')
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
          !skippedFiles.has(conflict.file) && conflict.type === 'name'
        )
        .map((conflict) => 
          new File([conflict.file], conflict.finalName, {
            type: conflict.file.type,
            lastModified: conflict.file.lastModified,
          })
        )

      if (filesToUpload.length > 0) {
        const apiParentId = targetParentId === 'root' ? null : targetParentId
        await uploadFiles(filesToUpload, apiParentId || undefined)
      }
      
      // Clear processed batch when upload completes successfully
      setProcessedBatches(prev => {
        const newSet = new Set(prev)
        if (batchId) newSet.delete(batchId)
        return newSet
      })
      onComplete()
    } catch (error) {
      console.error('Error uploading resolved conflicts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      toast('Upload failed', { description: errorMessage })
      setOpen(true)
    }
  }

  const handleNameChange = (name: string) => {
    setFileName(name)
    if (error) setError('')
  }

  const handleSkip = async () => {
    const currentFile = conflicts[currentIndex].file
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

  if (!open || conflicts.length === 0) {
    return null
  }

  const currentConflict = conflicts[currentIndex]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <ConflictForm
          conflict={currentConflict}
          fileName={fileName}
          error={error}
          onNameChange={handleNameChange}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          isLoading={operationLoading.uploadFiles}
          currentIndex={currentIndex}
          totalConflicts={conflicts.length}
        />
      </DialogContent>
    </Dialog>
  )
}
