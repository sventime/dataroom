'use client'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HarveyLoader } from '@/components/ui/harvey-loader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDataroomStore } from '@/store/dataroom-store'
import {
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  File,
  Folder,
  MoreHorizontal,
  User,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SharedDataroomPathPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const path = (params.path as string[]) || []

  const {
    dataroom,
    currentFolderId,
    sharedRootId,
    isInitialized,
    isLoading,
    error,
    breadcrumbs,
    loadSharedDataroom,
    navigateToFolder,
    navigateToPath,
    getChildNodes,
    getNodePath,
    buildPathFromFolderId,
    isDescendantOfSharedRoot,
  } = useDataroomStore()

  const [animatingOut, setAnimatingOut] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  // Load everything once on mount
  useEffect(() => {
    if (!token) return
    if (!isInitialized) {
      setShowLoader(true)
      loadSharedDataroom(token)
    }
  }, [token, isInitialized, loadSharedDataroom])

  // Handle animate out when loading completes
  useEffect(() => {
    if (dataroom && isInitialized && !animatingOut && !isLoading) {
      console.log('Starting animation out...')
      const timer = setTimeout(() => {
        setAnimatingOut(true)
        setTimeout(() => {
          console.log('Hiding loader')
          setShowLoader(false)
        }, 300)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [dataroom, isInitialized, isLoading, animatingOut])

  // Navigate to initial path after data is loaded
  useEffect(() => {
    if (!isInitialized || !dataroom) return

    if (path.length > 0) {
      navigateToPath(path)
    } else {
      navigateToFolder(sharedRootId)
    }
  }, [
    isInitialized,
    dataroom,
    path.join('/'),
    sharedRootId,
    navigateToPath,
    navigateToFolder,
  ])

  // Handle URL navigation changes (back/forward)
  useEffect(() => {
    if (!isInitialized || !dataroom) return

    if (path.length > 0) {
      navigateToPath(path)
    } else {
      navigateToFolder(sharedRootId)
    }
  }, [
    path.join('/'),
    isInitialized,
    dataroom,
    sharedRootId,
    navigateToPath,
    navigateToFolder,
  ])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return (
      dateObj.toLocaleDateString() +
      ' ' +
      dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }

  const handleFolderNavigation = (folderId: string | null) => {
    // Handle special shared-root ID for root sharing
    const actualFolderId = folderId === 'shared-root' ? sharedRootId : folderId

    if (
      actualFolderId &&
      !isDescendantOfSharedRoot(actualFolderId) &&
      actualFolderId !== sharedRootId
    ) {
      return
    }

    navigateToFolder(actualFolderId)
    const newPath = buildPathFromFolderId(actualFolderId)
    const newUrl =
      newPath.length > 0 ? `/share/${token}/${newPath.join('/')}` : `/share/${token}`

    router.push(newUrl)
  }

  const handlePreview = (fileId: string) => {
    const previewUrl = `/api/files/${fileId}/preview?token=${token}`
    window.open(previewUrl, '_blank')
  }

  const handleDownload = (fileId: string, fileName: string) => {
    const downloadUrl = `/api/files/${fileId}/download?token=${token}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const showLoading = showLoader

  // Debug logs
  console.log('States:', {
    dataroom: !!dataroom,
    isInitialized,
    isLoading,
    animatingOut,
    showLoader,
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {showLoading && (
        <div
          className={`fixed inset-0 z-50 bg-background flex items-center justify-center ${
            animatingOut
              ? 'animate-out fade-out-0 zoom-out-95 duration-300'
              : 'animate-in fade-in-0 zoom-in-98'
          }`}
        >
          <HarveyLoader message="Loading shared dataroom..." />
        </div>
      )}
      {dataroom && (
        <>
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    Harvey: Data Room
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    Shared by {dataroom?.owner.name || dataroom?.owner.email}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Read Only
                </Badge>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id || 'shared-root'} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handleFolderNavigation(crumb.id)
                          }}
                        >
                          {crumb.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getChildNodes(currentFolderId).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        This folder is empty
                      </TableCell>
                    </TableRow>
                  ) : (
                    getChildNodes(currentFolderId).map((node) => (
                      <TableRow
                        key={node.id}
                        className=" hover:bg-accent/50"
                        onDoubleClick={() => {
                          if (node.type === 'folder') {
                            handleFolderNavigation(node.id)
                          } else {
                            handlePreview(node.id)
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {node.type === 'folder' ? (
                              <Folder className="h-5 w-5 flex-shrink-0" />
                            ) : (
                              <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                            <span className="truncate font-medium">{node.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {node.type === 'file' && node.size
                            ? formatFileSize(node.size)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(node.updatedAt)}
                        </TableCell>
                        <TableCell className="w-12">
                          {node.type === 'file' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePreview(node.id)}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownload(node.id, node.name)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFolderNavigation(node.id)
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </main>
        </>
      )}
    </div>
  )
}
