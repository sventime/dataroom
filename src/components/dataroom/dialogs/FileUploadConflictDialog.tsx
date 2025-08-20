'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload } from 'lucide-react'
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

interface FileUploadConflictDialogProps {
  files: File[]
  parentId?: string
  onComplete: () => void
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
}: FileUploadConflictDialogProps) {
  const [open, setOpen] = useState(false)
  const [conflicts, setConflicts] = useState<FileConflict[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [skippedFiles, setSkippedFiles] = useState<Set<File>>(new Set())
  const processedFilesRef = useRef<string[]>([])
  const { uploadFile, nodes, currentFolderId } = useDataroomStore()

  // Check for conflicts and set up dialog
  useEffect(() => {
    if (files.length === 0) return

    // Create a unique key for this batch of files
    const filesKey = files.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join('|')

    // Check if we've already processed these exact files
    if (processedFilesRef.current.includes(filesKey)) return

    processedFilesRef.current.push(filesKey)

    // Reset skipped files for new batch
    setSkippedFiles(new Set())

    const targetParentId = parentId || currentFolderId
    const parent = nodes[targetParentId]

    if (!parent || parent.type !== 'folder') return

    const fileConflicts: FileConflict[] = []

    files.forEach((file) => {
      // Check if file name already exists
      const nameExists = parent.children?.some((childId) => {
        const child = nodes[childId]
        return child && child.name.toLowerCase() === file.name.toLowerCase()
      })

      if (nameExists) {
        // Generate suggested name
        const nameParts = file.name.split('.')
        const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : ''
        const baseName = nameParts.join('.')
        const suggestedName = `${baseName} (copy)${extension}`

        fileConflicts.push({
          file,
          suggestedName,
          finalName: suggestedName,
        })
      }
    })

    if (fileConflicts.length > 0) {
      setConflicts(fileConflicts)
      setCurrentIndex(0)
      setFileName(fileConflicts[0].suggestedName)
      setOpen(true)
    } else {
      // No conflicts, upload all files directly
      files.forEach((file) => uploadFile(file, targetParentId))
      onComplete()
    }
  }, [files, parentId, currentFolderId, nodes, uploadFile, onComplete])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = fileName.trim()
    if (!trimmedName) return

    const targetParentId = parentId || currentFolderId
    const parent = nodes[targetParentId]

    // Check if the new name conflicts with existing files
    if (parent?.children) {
      const nameExists = parent.children.some((childId) => {
        const child = nodes[childId]
        return child && child.name.toLowerCase() === trimmedName.toLowerCase()
      })

      if (nameExists) {
        setError('A file with this name already exists.')
        return
      }
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
      // All conflicts resolved, upload files
      setOpen(false)
      uploadAllFiles(updatedConflicts)
    }
  }

  const uploadAllFiles = (resolvedConflicts: FileConflict[]) => {
    const targetParentId = parentId || currentFolderId

    // Upload non-conflicting files with original names (excluding skipped files)
    files.forEach((file) => {
      // Skip if this file is marked as skipped
      if (skippedFiles.has(file)) return

      const conflict = resolvedConflicts.find((c) => c.file === file)
      if (!conflict) {
        uploadFile(file, targetParentId)
      }
    })

    // Upload conflicting files with resolved names (excluding skipped files)
    resolvedConflicts.forEach((conflict) => {
      // Skip if this file is marked as skipped
      if (skippedFiles.has(conflict.file)) return

      // Create a new file with the resolved name
      const renamedFile = new File([conflict.file], conflict.finalName, {
        type: conflict.file.type,
        lastModified: conflict.file.lastModified,
      })
      uploadFile(renamedFile, targetParentId)
    })

    onComplete()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value)
    if (error) setError('')
  }

  const handleSkip = () => {
    const currentFile = conflicts[currentIndex].file

    // Mark current file as skipped
    setSkippedFiles((prev) => new Set(prev.add(currentFile)))

    if (currentIndex < conflicts.length - 1) {
      // Move to next conflict
      setCurrentIndex(currentIndex + 1)
      setFileName(conflicts[currentIndex + 1].suggestedName)
      setError('')
    } else {
      // No more conflicts, upload remaining files
      setOpen(false)
      uploadAllFiles(conflicts)
    }
  }

  const handleCancel = () => {
    // Cancel all uploads - close dialog and call onComplete without uploading anything
    setOpen(false)
    onComplete()
  }

  if (!open || conflicts.length === 0) return null

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
            <Button type="submit" disabled={!fileName.trim()}>
              <Upload className="h-4 w-4 mr-0" />
              {currentIndex < conflicts.length - 1 ? 'Next' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
