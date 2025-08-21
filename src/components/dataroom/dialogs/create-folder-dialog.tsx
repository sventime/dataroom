'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDataroomStore } from '@/store/dataroom-store'
import { FolderPlus, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CreateFolderDialogProps {
  children?: React.ReactNode
  parentId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateFolderDialog({
  children,
  parentId,
  open: controlledOpen,
  onOpenChange,
}: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')
  const { createFolder, currentFolderId, nodes, operationLoading } = useDataroomStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) return

    const trimmedName = folderName.trim()
    const targetParentId = parentId || currentFolderId || 'root'
    const parentNode = nodes[targetParentId]

    if (parentNode && parentNode.type === 'folder' && 'children' in parentNode) {
      const nameExists = parentNode.children.some((childId) => {
        const child = nodes[childId]
        return child && child.name.toLowerCase() === trimmedName.toLowerCase()
      })

      if (nameExists) {
        setError('A folder or file with this name already exists.')
        return
      }
    }

    try {
      await createFolder(trimmedName, targetParentId)
      setFolderName('')
      setError('')
      if (onOpenChange) {
        onOpenChange(false)
      } else {
        setInternalOpen(false)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen)
    } else {
      setInternalOpen(isOpen)
    }
    if (!isOpen) {
      setFolderName('')
      setError('')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value)
    if (error) setError('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === '/') {
        e.preventDefault()
        if (onOpenChange) {
          onOpenChange(true)
        } else {
          setInternalOpen(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FolderPlus className="h-4 w-4 mr-2" />
            <div className="flex justify-between items-center flex-1">
              New Folder{' '}
              <span className="text-muted-foreground text-xs tracking-widest">⌘/</span>
            </div>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-3">
              <Input
                id="folder-name"
                value={folderName}
                onChange={handleNameChange}
                placeholder="Enter folder name..."
                autoFocus
                className={error ? 'border-destructive' : ''}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!folderName.trim() || operationLoading.createFolder}
            >
              {operationLoading.createFolder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4" />
              )}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
