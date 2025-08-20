'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import SignOutButton from '@/components/auth/sign-out-button'
import { Search } from '@/components/dataroom/search'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { FileTable } from '@/components/dataroom/content/FileTable'
import { Breadcrumbs } from '@/components/dataroom/breadcrumbs/Breadcrumbs'
import { FileUploadConflictDialog } from '@/components/dataroom/dialogs/FileUploadConflictDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { HarveyLoader } from '@/components/ui/harvey-loader'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useDataroomStore } from '@/store/dataroom-store'
import { Upload } from 'lucide-react'

export default function DataroomPathPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataroomId = params.dataroomId as string
  const path = (params.path as string[]) || []

  const {
    breadcrumbs,
    navigateToFolder,
    currentFolderId,
    loadDataroomById,
    isLoading,
    error,
    dataroom,
    navigateToPath,
    operationLoading,
    selectMultiple,
  } = useDataroomStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<
    'preparing' | 'uploading' | 'complete' | 'error'
  >('preparing')

  const handleProgressUpdate = (
    progress: number,
    status: 'preparing' | 'uploading' | 'complete' | 'error',
  ) => {
    setUploadProgress(progress)
    setUploadStatus(status)
  }

  // Load dataroom data first and reset initialization when dataroomId changes
  useEffect(() => {
    setIsInitialized(false) // Reset when dataroomId changes
    if (status === 'authenticated' && dataroomId && !dataroom) {
      loadDataroomById(dataroomId)
    }
  }, [status, dataroomId, dataroom])

  // Handle initial navigation after dataroom is loaded
  useEffect(() => {
    if (dataroom && !isInitialized) {
      if (path.length > 0) {
        navigateToPath(path)
      } else {
        navigateToFolder('root')
      }
      setIsInitialized(true)
    }
  }, [dataroom, isInitialized])

  useEffect(() => {
    if (isInitialized && dataroom) {
      const selectedParam = searchParams.get('selected')
      const currentSelection = useDataroomStore.getState().selectedNodeIds
      
      if (selectedParam) {
        const selectedIds = selectedParam.split(',').filter(id => id.trim())
        const selectionChanged = selectedIds.length !== currentSelection.length || 
          !selectedIds.every(id => currentSelection.includes(id))
        
        if (selectedIds.length > 0 && selectionChanged) {
          selectMultiple(selectedIds)
        }
      } else if (currentSelection.length > 0) {
        selectMultiple([])
      }
    }
  }, [isInitialized, searchParams, selectMultiple])

  useEffect(() => {
    if (!isInitialized || !dataroom || !currentFolderId) return

    const pathSegments = breadcrumbs
      .slice(1)
      .map((crumb) => encodeURIComponent(crumb.name))

    const expectedPath =
      pathSegments.length > 0
        ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
        : `/dataroom/${dataroom.id}`

    const currentURL = window.location.pathname
    const currentSearch = window.location.search

    if (currentURL !== expectedPath) {
      setTimeout(() => {
        const latestURL = window.location.pathname
        const latestSearch = window.location.search
        
        if (latestURL !== expectedPath) {
          router.replace(expectedPath + latestSearch)
        }
      }, 150)
    }
  }, [currentFolderId, isInitialized])

  useEffect(() => {
    const handleFileUpload = (event: CustomEvent) => {
      if (isUploading) return // Prevent new uploads while one is in progress

      const { files } = event.detail
      setPendingFiles(Array.from(files))
      setIsUploading(true)
      setUploadProgress(0)
      setUploadStatus('preparing')
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
        setIsDragOver(false)
        setDragCounter(0)
      }
      // Don't clear drag state if drop is inside main content - let the main handler deal with it
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

    if (isUploading) return // Prevent new uploads while one is in progress

    const files = Array.from(e.dataTransfer.files)
    setPendingFiles(files)
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('preparing')
  }

  const handleUploadComplete = () => {
    setPendingFiles([])
    setIsUploading(false)
    setUploadProgress(0)
    setUploadStatus('preparing')
  }

  if (status === 'loading' || (isLoading && !isInitialized)) {
    return <HarveyLoader />
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access your dataroom.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // Validate dataroom access
  if (dataroom && dataroom.id !== dataroomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have access to this dataroom.</p>
        </div>
      </div>
    )
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
          {(isDragOver || isUploading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/20 rounded-lg z-50 pointer-events-none animate-in fade-in-0 duration-200">
              <Card className="shadow-xl animate-in zoom-in-95 duration-200 bg-background min-w-80">
                <CardContent className="p-8 py-4 text-center">
                  {isUploading ? (
                    <>
                      <Progress
                        value={Math.round(uploadProgress)}
                        className="w-full h-2 my-4"
                      />
                      <h2 className="mb-1 !font-sans">
                        {uploadStatus === 'preparing' && 'Uploading Files'}
                        {uploadStatus === 'uploading' && 'Uploading Files'}
                        {uploadStatus === 'complete' && 'Upload Complete!'}
                        {uploadStatus === 'error' && 'Upload Failed'}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {uploadStatus === 'preparing' &&
                          `Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to your dataroom...`}
                        {uploadStatus === 'uploading' &&
                          `Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to your dataroom...`}
                        {uploadStatus === 'complete' &&
                          `Successfully uploaded ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}!`}
                        {uploadStatus === 'error' && 'Please try again'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto mb-4 text-primary" />
                      <h2 className="mb-1 !font-sans">Release To Upload Files</h2>
                      <p className="text-muted-foreground text-sm">
                        Files will be uploaded to the current folder
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <FileTable />
        </div>
      </SidebarInset>

      {/* File Upload Conflict Dialog */}
      <FileUploadConflictDialog
        files={pendingFiles}
        parentId={currentFolderId}
        onComplete={handleUploadComplete}
        open={pendingFiles.length > 0 && !isLoading}
        onProgressUpdate={handleProgressUpdate}
      />
    </SidebarProvider>
  )
}
