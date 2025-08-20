'use client'

import SignOutButton from '@/components/auth/sign-out-button'
import { Search } from '@/components/dataroom/search'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { FileTable } from '@/components/dataroom/content/FileTable'
import { Breadcrumbs } from '@/components/dataroom/breadcrumbs/Breadcrumbs'
import { FileUploadConflictDialog } from '@/components/dataroom/dialogs/FileUploadConflictDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

import { useDataroomStore } from '@/store/dataroom-store'
import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function DataroomPage() {
  const { data: session, status } = useSession()
  const {
    breadcrumbs,
    navigateToFolder,
    currentFolderId,
    uploadFile,
    initializeWithUser,
  } = useDataroomStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  // Initialize dataroom with user's name
  useEffect(() => {
    if (status === 'loading') return // Still loading session

    if (!isInitialized) {
      if (session?.user) {
        // Create personalized root folder name using email only
        const rootFolderName = session.user.email
          ? `Data Room (${session.user.email})`
          : 'Data Room'
        initializeWithUser(rootFolderName)
      } else {
        // No session, initialize with default name
        initializeWithUser()
      }
      setIsInitialized(true)
    }
  }, [session, status, initializeWithUser, isInitialized])

  // Listen for file upload events from sidebar
  useEffect(() => {
    const handleFileUpload = (event: CustomEvent) => {
      const { files } = event.detail
      setPendingFiles(Array.from(files))
    }

    window.addEventListener('fileUpload', handleFileUpload as EventListener)
    return () =>
      window.removeEventListener('fileUpload', handleFileUpload as EventListener)
  }, [])

  // Add comprehensive drag event listeners
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) {
        setDragCounter((prev) => prev + 1)
        setIsDragOver(true)
      }
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setDragCounter((prev) => {
        const newCount = prev - 1
        if (newCount <= 0) {
          setIsDragOver(false)
          return 0
        }
        return newCount
      })
    }

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleWindowDrop = (e: DragEvent) => {
      // Only prevent default if the drop is outside our main content area
      const mainContent = document.querySelector('[data-drop-zone="true"]')
      if (!mainContent || !mainContent.contains(e.target as Node)) {
        e.preventDefault()
      }
      setIsDragOver(false)
      setDragCounter(0)
    }

    const handleWindowDragEnd = () => {
      setIsDragOver(false)
      setDragCounter(0)
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('drop', handleWindowDrop)
    window.addEventListener('dragend', handleWindowDragEnd)

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('drop', handleWindowDrop)
      window.removeEventListener('dragend', handleWindowDragEnd)
    }
  }, [])

  const handleDeleteComplete = () => {
    // Navigate to parent after deletion
    if (breadcrumbs.length > 1) {
      const parent = breadcrumbs[breadcrumbs.length - 2]
      navigateToFolder(parent.id)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    setPendingFiles(files)
  }

  const handleUploadComplete = () => {
    setPendingFiles([])
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '20rem',
        '--sidebar-width-mobile': '20rem',
      }}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs onDeleteComplete={handleDeleteComplete} />
          </div>
          <div className="flex items-center gap-4">
            <Search />
            <SignOutButton />
          </div>
        </header>

        <div
          className={`flex-1 p-4 overflow-auto relative transition-all duration-200 rounded-md ${
            isDragOver
              ? 'bg-accent/20 border-2 border-dashed border-muted-foreground'
              : ''
          }`}
          data-drop-zone="true"
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/20 rounded-lg z-50 pointer-events-none animate-in fade-in-0 duration-200">
              <Card className="shadow-xl animate-in zoom-in-95 duration-200 bg-background">
                <CardContent className="p-8 py-4 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h2 className=" mb-1 !font-sans">Release To Upload Files</h2>
                  <p className="text-muted-foreground text-sm">
                    Files will be uploaded to the current folder
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          <FileTable />
        </div>
      </SidebarInset>

      {/* File Upload Conflict Dialog */}
      {pendingFiles.length > 0 && (
        <FileUploadConflictDialog
          files={pendingFiles}
          parentId={currentFolderId}
          onComplete={handleUploadComplete}
        />
      )}
    </SidebarProvider>
  )
}
