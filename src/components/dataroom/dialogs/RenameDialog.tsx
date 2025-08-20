'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { useDataroomStore } from '@/store/dataroom-store'

interface RenameDialogProps {
  children?: React.ReactNode
  nodeId: string
  currentName: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function RenameDialog({ children, nodeId, currentName, open: controlledOpen, onOpenChange }: RenameDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const { renameNode, nodes } = useDataroomStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = newName.trim()
    if (!trimmedName || trimmedName === currentName) return

    // Find the node and its parent to check for duplicates
    const node = nodes[nodeId]
    if (!node) return

    const parent = nodes[node.parentId!]
    if (parent && parent.children) {
      // Check if name already exists among siblings (excluding current node)
      const nameExists = parent.children.some(childId => {
        if (childId === nodeId) return false // Skip current node
        const child = nodes[childId]
        return child && child.name.toLowerCase() === trimmedName.toLowerCase()
      })

      if (nameExists) {
        setError('A file or folder with this name already exists.')
        return
      }
    }

    renameNode(nodeId, trimmedName)
    setNewName('')
    setError('')
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      setInternalOpen(false)
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
    if (error) setError('') // Clear error when user starts typing
  }

  const dialogContent = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
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
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
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
              disabled={!newName.trim() || newName.trim() === currentName}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return dialogContent
}
