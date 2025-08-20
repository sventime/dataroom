'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

type DialogType = 'rename' | 'delete' | 'createFolder' | 'bulkDelete'

interface DialogState {
  type: DialogType | null
  props: any
  open: boolean
}

interface DialogContextType {
  openDialog: (type: DialogType, props?: any) => void
  closeDialog: () => void
  dialogState: DialogState
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    props: {},
    open: false,
  })

  const openDialog = useCallback((type: DialogType, props: any = {}) => {
    setDialogState({
      type,
      props,
      open: true,
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      open: false,
    }))
    setTimeout(() => {
      setDialogState({
        type: null,
        props: {},
        open: false,
      })
    }, 200)
  }, [])

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog, dialogState }}>
      {children}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
