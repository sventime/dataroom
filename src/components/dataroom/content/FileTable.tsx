'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDialog } from '@/contexts/DialogContext'
import { useDataroomStore } from '@/store/dataroom-store'
import type { DataroomNode } from '@/types/dataroom'
import {
  Copy,
  Download,
  Edit,
  ExternalLink,
  File,
  Folder,
  MoreHorizontal,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FileTableProps {
  className?: string
}

interface FileRowProps {
  node: DataroomNode
  isSelected: boolean
  onSelect: (nodeId: string, selected: boolean) => void
}

function FileRow({ node, isSelected, onSelect }: FileRowProps) {
  const { navigateToFolder, dataroom } = useDataroomStore()
  const { openDialog } = useDialog()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleDoubleClick = () => {
    if (node.type === 'folder') {
      navigateToFolder(node.id)
    } else if (node.type === 'file') {
      const previewUrl = `/api/files/${node.id}/preview`
      window.open(previewUrl, '_blank')
    }
  }

  const handlePreview = () => {
    const previewUrl = `/api/files/${node.id}/preview`
    window.open(previewUrl, '_blank')
  }

  const handleCopyShareLink = async () => {
    if (!dataroom) return

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataroomId: dataroom.id,
          folderId: node.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create share link')
      }

      const { shareUrl } = await response.json()

      await navigator.clipboard.writeText(shareUrl)

      toast('Share link copied!', {
        description: `Link for "${node.name}" has been copied to your clipboard`,
      })
    } catch (error) {
      console.error('Error creating share link:', error)
      toast('Failed to copy share link', {
        description: 'Please try again or contact support if the problem persists',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }

  return (
    <TableRow
      className={`cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent/50' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(node.id, !!checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>

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

      <TableCell className="text-muted-foreground ">
        {node.type === 'file' ? formatFileSize(node.size) : '-'}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {formatDate(node.updatedAt)}
      </TableCell>

      <TableCell className="w-12">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
            {node.type === 'file' && (
              <>
                <DropdownMenuItem onClick={handlePreview}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {node.type === 'folder' && (
              <>
                <DropdownMenuItem onClick={handleCopyShareLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onSelect={() => {
                openDialog('rename', { nodeId: node.id, currentName: node.name })
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                openDialog('delete', { nodeId: node.id, nodeName: node.name })
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function FileTable({ className }: FileTableProps) {
  const {
    getChildNodes,
    currentFolderId,
    selectedNodeIds,
    selectNode,
    selectMultiple,
    clearSelection,
    dataroom,
    breadcrumbs,
  } = useDataroomStore()
  const { openDialog } = useDialog()
  const router = useRouter()
  const searchParams = useSearchParams()

  const nodes = getChildNodes(currentFolderId)
  const [allSelected, setAllSelected] = useState(false)

  const updateURLWithSelections = (newSelectedIds: string[]) => {
    if (!dataroom) return

    const pathSegments = breadcrumbs
      .slice(1)
      .map((crumb) => encodeURIComponent(crumb.name))

    const basePath =
      pathSegments.length > 0
        ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
        : `/dataroom/${dataroom.id}`

    const searchParams = new URLSearchParams()
    if (newSelectedIds.length > 0) {
      searchParams.set('selected', newSelectedIds.join(','))
    }

    const newPath = searchParams.toString()
      ? `${basePath}?${searchParams.toString()}`
      : basePath

    router.replace(newPath)
  }

  // Sync URL selections whenever URL or nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const selectedParam = searchParams.get('selected')
      const currentSelection = selectedNodeIds

      console.log('FileTable URL sync check:', {
        selectedParam,
        currentSelection,
        nodes: nodes.length,
      })

      if (selectedParam) {
        const decodedParam = decodeURIComponent(selectedParam)
        const selectedIds = decodedParam.split(',').filter((id) => id.trim())
        const nodeIds = nodes.map((node) => node.id)
        const validSelectedIds = selectedIds.filter((id) => nodeIds.includes(id))

        // Check if selection has changed
        const selectionChanged =
          validSelectedIds.length !== currentSelection.length ||
          !validSelectedIds.every((id) => currentSelection.includes(id))

        console.log('FileTable URL sync:', {
          selectedParam,
          decodedParam,
          selectedIds,
          nodeIds,
          validSelectedIds,
          currentSelection,
          selectionChanged,
          willUpdate: selectionChanged && validSelectedIds.length > 0,
        })

        if (selectionChanged && validSelectedIds.length > 0) {
          selectMultiple(validSelectedIds)
        } else if (selectionChanged && validSelectedIds.length === 0) {
          selectMultiple([])
        }
      } else if (currentSelection.length > 0) {
        console.log('FileTable clearing selection - no URL param')
        selectMultiple([])
      }
    }
  }, [nodes, searchParams, selectMultiple]) // Removed hasInitialized and selectedNodeIds to avoid conflicts

  useEffect(() => {
    const currentFolderNodeIds = nodes.map((node) => node.id)
    const selectedInCurrentFolder = selectedNodeIds.filter((id) =>
      currentFolderNodeIds.includes(id),
    )
    setAllSelected(nodes.length > 0 && selectedInCurrentFolder.length === nodes.length)

    console.log('FileTable selection state:', {
      nodes: nodes.length,
      currentFolderNodeIds,
      selectedNodeIds,
      selectedInCurrentFolder,
      allSelected: nodes.length > 0 && selectedInCurrentFolder.length === nodes.length,
    })
  }, [selectedNodeIds, nodes])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection = nodes.map((node) => node.id)
      selectMultiple(newSelection)
      setAllSelected(true)
      updateURLWithSelections(newSelection)
    } else {
      clearSelection()
      setAllSelected(false)
      updateURLWithSelections([])
    }
  }

  const handleSelectNode = (nodeId: string, selected: boolean) => {
    if (selected) {
      const newSelection = [...selectedNodeIds, nodeId]
      selectMultiple(newSelection)
      setAllSelected(newSelection.length === nodes.length)
      updateURLWithSelections(newSelection)
    } else {
      const newSelection = selectedNodeIds.filter((id) => id !== nodeId)
      selectMultiple(newSelection)
      setAllSelected(false)
      updateURLWithSelections(newSelection)
    }
  }

  if (nodes.length === 0) {
    return (
      <div
        className={`flex text-center flex-col flex-1 h-full items-center justify-center py-12 text-muted-foreground pt-10 ${className}`}
      >
        <Upload className="h-10 w-10 mb-4" />
        <p className="mb-4">
          Up to 5MB
          <br />
          Drop PDF files here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
              </TableHead>

              {selectedNodeIds.length > 0 ? (
                <TableHead colSpan={5}>
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    <div className="flex items-center justify-end animate-in px-2 fade-in-0 zoom-in-95 duration-300">
                      <div className="flex items-center">
                        <span className="text-sm font-medium px-4">
                          {selectedNodeIds.length}{' '}
                          {selectedNodeIds.length === 1 ? 'item' : 'items'} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            clearSelection()
                            setAllSelected(false)
                            updateURLWithSelections([])
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Clear selection
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 text-destructive focus:text-destructive cursor-pointer hover:text-destructive "
                          onClick={(e) => {
                            e.stopPropagation()
                            openDialog('bulkDelete', { nodeIds: selectedNodeIds })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          Delete All ({selectedNodeIds.length})
                        </Button>
                      </div>
                    </div>
                  </div>
                </TableHead>
              ) : (
                <>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead></TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <FileRow
                key={node.id}
                node={node}
                isSelected={selectedNodeIds.includes(node.id)}
                onSelect={handleSelectNode}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
