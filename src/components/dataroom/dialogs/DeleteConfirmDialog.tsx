'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { useDataroomStore } from '@/store/dataroom-store'

interface DeleteConfirmDialogProps {
  children?: React.ReactNode
  nodeId: string
  nodeName: string
  onConfirm?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteConfirmDialog({
  children,
  nodeId,
  nodeName,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const { deleteNode } = useDataroomStore()

  const handleConfirm = () => {
    deleteNode(nodeId)
    onConfirm?.()
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
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{nodeName}&quot;? <br /> This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
