'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useDataroomStore } from '@/store/dataroom-store'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface BulkDeleteConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  nodeIds: string[]
  children?: React.ReactNode
}

export function BulkDeleteConfirmDialog({
  open: controlledOpen,
  onOpenChange,
  nodeIds,
  children,
}: BulkDeleteConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const { deleteBulk, nodes, operationLoading } = useDataroomStore()

  const handleConfirm = async () => {
    try {
      await deleteBulk(nodeIds)
      if (onOpenChange) {
        onOpenChange(false)
      } else {
        setInternalOpen(false)
      }
    } catch (error) {
      console.error('Failed to delete nodes:', error)
    }
  }

  const handleCancel = () => {
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

  const selectedItems = nodeIds.map((id) => nodes[id]).filter(Boolean)
  const folderCount = selectedItems.filter((item) => item.type === 'folder').length
  const fileCount = selectedItems.filter((item) => item.type === 'file').length

  const getItemDescription = () => {
    if (folderCount > 0 && fileCount > 0) {
      return `${folderCount} folder${folderCount > 1 ? 's' : ''} and ${fileCount} file${fileCount > 1 ? 's' : ''}`
    } else if (folderCount > 0) {
      return `${folderCount} folder${folderCount > 1 ? 's' : ''}`
    } else {
      return `${fileCount} file${fileCount > 1 ? 's' : ''}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Selected Items</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Are you sure you want to delete {getItemDescription()} with all content?
          </DialogDescription>
        </DialogHeader>

        
        {selectedItems.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Items to delete:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {selectedItems.slice(0, 5).map((item) => (
                <li key={item.id} className="truncate">
                  • {item.name}
                </li>
              ))}
              {selectedItems.length > 5 && (
                <li className="text-xs italic">
                  ...and {selectedItems.length - 5} more items
                </li>
              )}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={operationLoading.bulkDelete}
          >
            {operationLoading.bulkDelete ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {`Delete ${nodeIds.length} Item${nodeIds.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
