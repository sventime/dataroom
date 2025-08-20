'use client'

import SignOutButton from '@/components/auth/sign-out-button'
import { Breadcrumbs } from '@/components/dataroom/breadcrumbs/Breadcrumbs'
import { FileTable } from '@/components/dataroom/content/FileTable'
import { FileUploadConflictDialog } from '@/components/dataroom/dialogs/FileUploadConflictDialog'
import { Search } from '@/components/dataroom/search'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useLoader } from '@/contexts/loader-context'
import { useDataroomStore } from '@/store/dataroom-store'
import { Upload } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DataroomPathPage() {
  const { status } = useSession()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataroomId = params.dataroomId as string
  const path = (params.path as string[]) || []
  const { hideLoader, showLoader, setMessage } = useLoader()

  const {
    breadcrumbs,
    navigateToFolder,
    currentFolderId,
    loadDataroomById,
    isLoading,
    error,
    dataroom,
    navigateToPath,
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
  const [isNavigatingFromUrl, setIsNavigatingFromUrl] = useState(false)
  const [hasShownLoader, setHasShownLoader] = useState(false)

  // Show loader immediately on component mount - only on first load
  useEffect(() => {
    if (!hasShownLoader && (!dataroom || !isInitialized)) {
      setMessage('Loading dataroom...')
      showLoader()
      setHasShownLoader(true)
    }
  }, [dataroom, isInitialized, hasShownLoader, setMessage, showLoader])

  const handleProgressUpdate = (
    progress: number,
    status: 'preparing' | 'uploading' | 'complete' | 'error',
  ) => {
    setUploadProgress(progress)
    setUploadStatus(status)
  }

  // Load dataroom data
  useEffect(() => {
    if (!dataroom || dataroom.id !== dataroomId) {
      loadDataroomById(dataroomId)
    }
  }, [dataroomId, dataroom, loadDataroomById])

  useEffect(() => {
    if (dataroom && !isInitialized) {
      setIsNavigatingFromUrl(true)
      if (path.length > 0) {
        navigateToPath(path)
      } else {
        navigateToFolder('root')
      }
      setIsInitialized(true)
      setTimeout(() => setIsNavigatingFromUrl(false), 100)
    }
  }, [dataroom, isInitialized, path, navigateToPath, navigateToFolder])

  useEffect(() => {
    if (isInitialized && dataroom) {
      const selectedParam = searchParams.get('selected')
      const currentSelection = useDataroomStore.getState().selectedNodeIds

      if (selectedParam) {
        const selectedIds = selectedParam.split(',').filter((id) => id.trim())
        const selectionChanged =
          selectedIds.length !== currentSelection.length ||
          !selectedIds.every((id) => currentSelection.includes(id))

        if (selectedIds.length > 0 && selectionChanged) {
          selectMultiple(selectedIds)
        }
      } else if (currentSelection.length > 0) {
        selectMultiple([])
      }
    }
  }, [isInitialized, searchParams, selectMultiple])

  // Handle animate out when loading completes
  useEffect(() => {
    if (dataroom && isInitialized && !isLoading && currentFolderId) {
      const timer = setTimeout(() => {
        hideLoader(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [dataroom, isInitialized, isLoading, currentFolderId, hideLoader])

  useEffect(() => {
    if (!isInitialized || !dataroom || !currentFolderId) return

    const pathSegments = breadcrumbs
      .slice(1)
      .map((crumb) => encodeURIComponent(crumb.name))
    const expectedPath =
      pathSegments.length > 0
        ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
        : `/dataroom/${dataroom.id}`

    // Only update URL if we're not already navigating from a URL change
    if (window.location.pathname !== expectedPath && !isNavigatingFromUrl) {
      setTimeout(() => {
        if (window.location.pathname !== expectedPath && !isNavigatingFromUrl) {
          router.push(expectedPath + window.location.search)
        }
      }, 150)
    }
  }, [currentFolderId, isInitialized, breadcrumbs, dataroom, router, isNavigatingFromUrl])

  // Handle URL changes (back/forward navigation)
  useEffect(() => {
    if (isInitialized && dataroom) {
      setIsNavigatingFromUrl(true)
      if (path.length > 0) {
        navigateToPath(path)
      } else {
        navigateToFolder('root')
      }
      setTimeout(() => setIsNavigatingFromUrl(false), 100)
    }
  }, [path.join('/'), isInitialized, dataroom, navigateToPath, navigateToFolder])

  useEffect(() => {
    const handleFileUpload = (event: CustomEvent) => {
      if (isUploading) return
      const { files } = event.detail
      setPendingFiles(Array.from(files))
      setIsUploading(true)
      setUploadProgress(0)
      setUploadStatus('preparing')
    }

    window.addEventListener('fileUpload', handleFileUpload as EventListener)
    return () =>
      window.removeEventListener('fileUpload', handleFileUpload as EventListener)
  }, [isUploading])

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) {
        setDragCounter((prev) => prev + 1)
        setIsDragOver(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
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

    const handleDragOver = (e: DragEvent) => e.preventDefault()

    const handleDrop = (e: DragEvent) => {
      const mainContent = document.querySelector('[data-drop-zone="true"]')
      if (!mainContent || !mainContent.contains(e.target as Node)) {
        e.preventDefault()
        setIsDragOver(false)
        setDragCounter(0)
      }
    }

    const handleDragEnd = () => {
      setIsDragOver(false)
      setDragCounter(0)
    }

    const events = [
      ['dragenter', handleDragEnter],
      ['dragleave', handleDragLeave],
      ['dragover', handleDragOver],
      ['drop', handleDrop],
      ['dragend', handleDragEnd],
    ] as const

    events.forEach(([event, handler]) => window.addEventListener(event, handler))
    return () =>
      events.forEach(([event, handler]) => window.removeEventListener(event, handler))
  }, [])

  const handleDeleteComplete = () => {
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

    if (isUploading) return

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

  // Don't render content until dataroom is loaded and initialized
  if (!dataroom || !isInitialized) {
    return null
  }

  return (
    <div className="relative">
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
                          {uploadStatus === 'complete'
                            ? 'Upload Complete!'
                            : uploadStatus === 'error'
                              ? 'Upload Failed'
                              : 'Uploading Files'}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {uploadStatus === 'complete'
                            ? `Successfully uploaded ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}!`
                            : uploadStatus === 'error'
                              ? 'Please try again'
                              : `Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to your dataroom...`}
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

        <FileUploadConflictDialog
          files={pendingFiles}
          parentId={currentFolderId}
          onComplete={handleUploadComplete}
          open={pendingFiles.length > 0 && !isLoading}
          onProgressUpdate={handleProgressUpdate}
        />
      </SidebarProvider>
    </div>
  )
}
