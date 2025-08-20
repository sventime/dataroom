'use client'

import { BulkDeleteConfirmDialog } from '@/components/dataroom/dialogs/BulkDeleteConfirmDialog'
import { CreateFolderDialog } from '@/components/dataroom/dialogs/CreateFolderDialog'
import { DeleteConfirmDialog } from '@/components/dataroom/dialogs/DeleteConfirmDialog'
import { RenameDialog } from '@/components/dataroom/dialogs/RenameDialog'
import { useDialog } from '@/contexts/DialogContext'

export function DialogRenderer() {
  const { dialogState, closeDialog } = useDialog()

  return (
    <>
      <RenameDialog
        nodeId={dialogState.type === 'rename' ? (dialogState.props.nodeId as string) : ''}
        currentName={dialogState.type === 'rename' ? (dialogState.props.currentName as string) : ''}
        {...(dialogState.type === 'rename' ? dialogState.props : {})}
        open={dialogState.type === 'rename' && dialogState.open}
        onOpenChange={closeDialog}
      />

      <DeleteConfirmDialog
        nodeId={dialogState.type === 'delete' ? (dialogState.props.nodeId as string) : ''}
        nodeName={dialogState.type === 'delete' ? (dialogState.props.nodeName as string) : ''}
        {...(dialogState.type === 'delete' ? dialogState.props : {})}
        open={dialogState.type === 'delete' && dialogState.open}
        onOpenChange={closeDialog}
      />

      <CreateFolderDialog
        {...(dialogState.type === 'createFolder' ? dialogState.props : {})}
        open={dialogState.type === 'createFolder' && dialogState.open}
        onOpenChange={closeDialog}
      />

      <BulkDeleteConfirmDialog
        nodeIds={dialogState.type === 'bulkDelete' ? (dialogState.props.nodeIds as string[]) : []}
        {...(dialogState.type === 'bulkDelete' ? dialogState.props : {})}
        open={dialogState.type === 'bulkDelete' && dialogState.open}
        onOpenChange={closeDialog}
      />
    </>
  )
}
