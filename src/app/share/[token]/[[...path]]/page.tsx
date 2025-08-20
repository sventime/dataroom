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
import {
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  File,
  Folder,
  MoreHorizontal,
  Share,
  User,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DataroomNode {
  id: string
  name: string
  type: 'FOLDER' | 'FILE'
  parentId: string | null
  mimeType?: string
  size?: number
  createdAt: string
  updatedAt: string
}

interface SharedDataroom {
  id: string
  name: string
  shareToken: string
  nodes: DataroomNode[]
  owner: {
    name: string
    email: string
  }
  sharedFolderId?: string
}

export default function SharedDataroomPathPage() {
  const params = useParams()
  const token = params.token as string
  const path = (params.path as string[]) || []

  const [dataroom, setDataroom] = useState<SharedDataroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [animatingOut, setAnimatingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [sharedRootId, setSharedRootId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDataroom = async () => {
      try {
        const pathQuery = path.length > 0 ? `?path=${path.join('/')}` : ''
        const response = await fetch(`/api/share/${token}${pathQuery}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dataroom')
        }
        const data = await response.json()
        setDataroom(data.dataroom)
        setSharedRootId(data.sharedFolderId || null)
        setCurrentFolderId(data.currentFolderId || data.sharedFolderId || null)
        
        // Add 1 second delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Start fade-out animation
        setAnimatingOut(true)
        await new Promise(resolve => setTimeout(resolve, 300)) // Animation duration
      } catch (error) {
        setError('This share link is invalid or has expired.')
        setAnimatingOut(true)
        await new Promise(resolve => setTimeout(resolve, 300))
      } finally {
        setLoading(false)
        setAnimatingOut(false)
      }
    }

    if (token) {
      fetchDataroom()
    }
  }, [token, path])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }

  const getCurrentFolderNodes = () => {
    if (!dataroom) return []
    return dataroom.nodes.filter((node) => node.parentId === currentFolderId)
  }

  const isDescendantOfSharedRoot = (folderId: string | null): boolean => {
    if (!dataroom || !sharedRootId) return folderId === null
    if (folderId === sharedRootId) return true
    if (folderId === null) return sharedRootId === null

    let current = dataroom.nodes.find((n) => n.id === folderId)
    while (current) {
      if (current.id === sharedRootId) return true
      current = current.parentId
        ? dataroom.nodes.find((n) => n.id === current!.parentId)
        : null
    }
    return false
  }

  const getBreadcrumbs = () => {
    if (!dataroom || !sharedRootId) return [{ id: sharedRootId, name: 'Shared Folder' }]

    const breadcrumbs = []
    let current = dataroom.nodes.find((n) => n.id === currentFolderId)

    while (current && current.id !== sharedRootId) {
      breadcrumbs.unshift({ id: current.id, name: current.name })
      current = current.parentId
        ? dataroom.nodes.find((n) => n.id === current!.parentId)
        : null
    }

    const sharedFolder = dataroom.nodes.find((n) => n.id === sharedRootId)
    breadcrumbs.unshift({
      id: sharedRootId,
      name: sharedFolder?.name || 'Shared Folder',
    })

    return breadcrumbs
  }

  const handleFolderNavigation = (folderId: string | null) => {
    if (!isDescendantOfSharedRoot(folderId) && folderId !== sharedRootId) {
      return
    }
    setCurrentFolderId(folderId)
  }

  const handlePreview = (fileId: string) => {
    const previewUrl = `/api/files/${fileId}/preview?token=${token}`
    window.open(previewUrl, '_blank')
  }

  const handleDownload = (fileId: string) => {
    const downloadUrl = `/api/files/${fileId}/download?token=${token}`
    window.open(downloadUrl)
  }

  const showLoading = loading || animatingOut

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

  if (!dataroom && !showLoading && !error) {
    return null
  }

  const nodes = getCurrentFolderNodes()
  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-background relative">
      {showLoading && (
        <div 
          className={`fixed inset-0 z-50 bg-background flex items-center justify-center ${
            animatingOut 
              ? 'animate-out fade-out-0 zoom-out-95 duration-300' 
              : 'animate-in fade-in-0 zoom-in-95'
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
                <Share className="h-6 w-6" />
                {dataroom.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                Shared by {dataroom.owner.name || dataroom.owner.email}
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
              {nodes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    This folder is empty
                  </TableCell>
                </TableRow>
              ) : (
                nodes.map((node) => (
                  <TableRow
                    key={node.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onDoubleClick={() => {
                      if (node.type === 'FOLDER') {
                        handleFolderNavigation(node.id)
                      } else {
                        handlePreview(node.id)
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {node.type === 'FOLDER' ? (
                          <Folder className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium">{node.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {node.type === 'FILE' && node.size
                        ? formatFileSize(node.size)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(node.updatedAt)}
                    </TableCell>
                    <TableCell className="w-12">
                      {node.type === 'FILE' ? (
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
                            <DropdownMenuItem onClick={() => handleDownload(node.id)}>
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
