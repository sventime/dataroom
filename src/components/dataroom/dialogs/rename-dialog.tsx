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
import { Edit, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RenameDialogProps {
  children?: React.ReactNode
  nodeId: string
  currentName: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function RenameDialog({
  children,
  nodeId,
  currentName,
  open: controlledOpen,
  onOpenChange,
}: RenameDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const { renameNode, nodes, operationLoading } = useDataroomStore()

  useEffect(() => {
    if (open && currentName) {
      setNewName(currentName)
      setError('')
    }
  }, [open, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = newName.trim()
    if (!trimmedName || trimmedName === currentName) return

    const node = nodes[nodeId]
    if (!node) return

    const parent = nodes[node.parentId!]
    if (parent && parent.type === 'folder' && 'children' in parent) {
      const nameExists = parent.children.some((childId) => {
        if (childId === nodeId) return false
        const child = nodes[childId]
        return child && child.name.toLowerCase() === trimmedName.toLowerCase()
      })

      if (nameExists) {
        setError('A file or folder with this name already exists.')
        return
      }
    }

    try {
      await renameNode(nodeId, trimmedName)
      setNewName('')
      setError('')
      if (onOpenChange) {
        onOpenChange(false)
      } else {
        setInternalOpen(false)
      }
    } catch (error) {
      console.error('Failed to rename node:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen)
    } else {
      setInternalOpen(isOpen)
    }
    if (isOpen) {
      setNewName(currentName)
      setError('')
    } else {
      setNewName('')
      setError('')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value)
    if (error) setError('')
  }

  const dialogContent = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
            Rename
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription>
              Enter a new name for &quot;{currentName}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Input
                id="new-name"
                value={newName}
                onChange={handleNameChange}
                placeholder="Enter new name..."
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
              disabled={
                !newName.trim() ||
                newName.trim() === currentName ||
                operationLoading.renameNode === nodeId
              }
            >
              {operationLoading.renameNode === nodeId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return dialogContent
}
