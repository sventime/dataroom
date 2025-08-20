'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  File, 
  Folder, 
  Download, 
  ExternalLink, 
  Share, 
  Eye,
  Clock,
  User
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HarveyLoader } from '@/components/ui/harvey-loader'

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
}

export default function SharedDataroomPage() {
  const params = useParams()
  const [dataroom, setDataroom] = useState<SharedDataroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDataroom = async () => {
      try {
        const response = await fetch(`/api/share/${params.token}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dataroom')
        }
        const data = await response.json()
        setDataroom(data.dataroom)
      } catch (error) {
        setError('This share link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }

    if (params.token) {
      fetchDataroom()
    }
  }, [params.token])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCurrentFolderNodes = () => {
    if (!dataroom) return []
    return dataroom.nodes.filter(node => node.parentId === currentFolderId)
  }

  const getBreadcrumbs = () => {
    if (!dataroom || !currentFolderId) return [{ id: null, name: 'Root' }]
    
    const breadcrumbs = []
    let current = dataroom.nodes.find(n => n.id === currentFolderId)
    
    while (current) {
      breadcrumbs.unshift({ id: current.id, name: current.name })
      current = current.parentId ? dataroom.nodes.find(n => n.id === current!.parentId) : null
    }
    
    breadcrumbs.unshift({ id: null, name: 'Root' })
    return breadcrumbs
  }

  const handlePreview = (fileId: string) => {
    const previewUrl = `/api/files/${fileId}/preview?token=${params.token}`
    window.open(previewUrl, '_blank')
  }

  const handleDownload = (fileId: string) => {
    const downloadUrl = `/api/files/${fileId}/download?token=${params.token}`
    window.open(downloadUrl, '_blank')
  }

  if (loading) {
    return <HarveyLoader message="Loading shared dataroom..." />
  }

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

  if (!dataroom) {
    return null
  }

  const nodes = getCurrentFolderNodes()
  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-background">
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
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className="hover:text-primary transition-colors"
                disabled={crumb.id === currentFolderId}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>

        {/* File Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                        setCurrentFolderId(node.id)
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
                      {node.type === 'FILE' && node.size ? formatFileSize(node.size) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(node.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {node.type === 'FILE' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePreview(node.id)
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(node.id)
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {node.type === 'FOLDER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentFolderId(node.id)
                            }}
                          >
                            Open
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}