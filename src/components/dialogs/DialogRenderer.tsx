'use client'

import { RenameDialog } from '@/components/dataroom/dialogs/RenameDialog'
import { DeleteConfirmDialog } from '@/components/dataroom/dialogs/DeleteConfirmDialog'
import { CreateFolderDialog } from '@/components/dataroom/dialogs/CreateFolderDialog'
import { BulkDeleteConfirmDialog } from '@/components/dataroom/dialogs/BulkDeleteConfirmDialog'
import { useDialog } from '@/contexts/DialogContext'

export function DialogRenderer() {
  const { dialogState, closeDialog } = useDialog()

  if (!dialogState.type || !dialogState.open) return null

  switch (dialogState.type) {
    case 'rename':
      return (
        <RenameDialog
          {...dialogState.props}
          open={dialogState.open}
          onOpenChange={closeDialog}
        />
      )
    case 'delete':
      return (
        <DeleteConfirmDialog
          {...dialogState.props}
          open={dialogState.open}
          onOpenChange={closeDialog}
        />
      )
    case 'createFolder':
      return (
        <CreateFolderDialog
          {...dialogState.props}
          open={dialogState.open}
          onOpenChange={closeDialog}
        />
      )
    case 'bulkDelete':
      return (
        <BulkDeleteConfirmDialog
          {...dialogState.props}
          open={dialogState.open}
          onOpenChange={closeDialog}
        />
      )
    default:
      return null
  }
}