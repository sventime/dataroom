'use client'

import SignOutButton from '@/components/auth/sign-out-button'
import { Breadcrumbs } from '@/components/dataroom/breadcrumbs'
import { FileUploadConflictDialog } from '@/components/dataroom/dialogs/file-upload-conflict-dialog'
import { FileTable } from '@/components/dataroom/file-table'
import { AppSidebar } from '@/components/dataroom/layout/sidebar'
import { Search } from '@/components/dataroom/search'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useLoader } from '@/contexts/loader-context'
import { useDataroomStore } from '@/store/dataroom-store'
import { Upload } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DataroomPathPage() {
  const { status } = useSession()
  const params = useParams()
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
  } = useDataroomStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<
    'preparing' | 'uploading' | 'complete' | 'error' | 'resolving'
  >('preparing')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [hasShownLoader, setHasShownLoader] = useState(false)

  useEffect(() => {
    if (!hasShownLoader && !dataroom) {
      setMessage('Loading Documents...')
      showLoader()
      setHasShownLoader(true)
    }
  }, [dataroom, hasShownLoader, setMessage, showLoader])

  const handleProgressUpdate = (
    progress: number,
    status: 'preparing' | 'uploading' | 'complete' | 'error' | 'resolving',
    uploadedCount?: number,
  ) => {
    setUploadProgress(progress)
    setUploadStatus(status)
    if (uploadedCount !== undefined) {
      setUploadedCount(uploadedCount)
    }
  }

  useEffect(() => {
    if (!dataroom || dataroom.id !== dataroomId) {
      loadDataroomById(dataroomId)
    }
  }, [dataroomId, dataroom, loadDataroomById])

  useEffect(() => {
    if (dataroom && !isInitialized) {
      if (path.length > 0) {
        navigateToPath(path)
      } else {
        navigateToFolder('root')
      }
      setIsInitialized(true)
    }
  }, [dataroom, isInitialized, path, navigateToPath, navigateToFolder])

  useEffect(() => {
    if (dataroom && isInitialized && !isLoading && currentFolderId) {
      const timer = setTimeout(() => {
        hideLoader(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [dataroom, isInitialized, isLoading, currentFolderId, hideLoader])

  useEffect(() => {
    if (isInitialized && dataroom) {
      if (path.length > 0) {
        navigateToPath(path)
      } else {
        navigateToFolder('root')
      }
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
    setUploadedCount(0)
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

  if (dataroom && dataroom.id !== dataroomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have access to this dataroom.
          </p>
        </div>
      </div>
    )
  }

  if (!dataroom) {
    return null
  }

  return (
    <div className="relative">
      <SidebarProvider
        style={
          {
            '--sidebar-width': '21rem',
            '--sidebar-width-mobile': '20rem',
          } as React.CSSProperties
        }
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
                              : uploadStatus === 'resolving'
                                ? 'Resolving Conflicts'
                                : 'Uploading Files'}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {uploadStatus === 'complete'
                            ? `Successfully uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}!`
                            : uploadStatus === 'error'
                              ? 'Please try again'
                              : uploadStatus === 'resolving'
                                ? 'Please resolve file conflicts in the dialog'
                                : `Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to your dataroom...`}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto mb-4 text-primary" />
                        <h2 className="mb-1 !font-sans">Release To Upload PDFs</h2>
                        <p className="text-muted-foreground text-sm">
                          Only PDF files will be uploaded to the current folder
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
          parentId={currentFolderId || undefined}
          onComplete={handleUploadComplete}
          open={pendingFiles.length > 0 && !isLoading}
          onProgressUpdate={handleProgressUpdate}
        />
      </SidebarProvider>
    </div>
  )
}
