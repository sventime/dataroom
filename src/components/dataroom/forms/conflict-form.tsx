'use client'

import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatFileSize } from '@/lib/constants'
import { FileConflict } from '@/lib/upload-utils'
import { Loader2, Upload } from 'lucide-react'
import { FormEvent } from 'react'

interface ConflictFormProps {
  conflict: FileConflict
  fileName: string
  error: string
  onNameChange: (name: string) => void
  onSubmit: (e: FormEvent) => void
  onSkip: () => void
  isLoading: boolean
  currentIndex: number
  totalConflicts: number
}

export function ConflictForm({
  conflict,
  fileName,
  error,
  onNameChange,
  onSubmit,
  onSkip,
  isLoading,
  currentIndex,
  totalConflicts,
}: ConflictFormProps) {
  const isLastConflict = currentIndex >= totalConflicts - 1

  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>
          {conflict.type === 'type'
            ? 'Invalid File Type'
            : conflict.type === 'size'
              ? 'File Size Limit Exceeded'
              : 'File Name Conflict'}
          {totalConflicts > 1 && ` (${currentIndex + 1} of ${totalConflicts})`}
        </DialogTitle>
        <DialogDescription>
          {conflict.type === 'type'
            ? conflict.reason
            : conflict.type === 'size'
              ? conflict.reason
              : `A file named "${conflict.file.name}" already exists.`}
        </DialogDescription>
      </DialogHeader>

      {conflict.type === 'name' && (
        <div className="grid gap-4 py-4">
          <div className="grid gap-3">
            <Input
              value={fileName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter new file name..."
              autoFocus
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      )}

      {(conflict.type === 'size' || conflict.type === 'type') && (
        <div className="grid gap-4 py-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            {conflict.type === 'size' ? (
              <>
                <p className="text-sm text-destructive font-medium">
                  File too large: {conflict.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(conflict.file.size)} (limit: 5MB)
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-destructive font-medium">
                  Invalid file type: {conflict.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Only PDF files are allowed.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <DialogFooter className="gap-2">
        <Button variant="outline" type="button" onClick={onSkip}>
          Skip This File
        </Button>
        {conflict.type === 'name' && (
          <Button type="submit" disabled={!fileName.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isLoading ? 'Uploading...' : isLastConflict ? 'Upload' : 'Next'}
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}
