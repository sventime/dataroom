'use client'

import { useState } from 'react'
import {
  File,
  Folder,
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Calendar,
  HardDrive,
  Upload,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useDataroomStore } from '@/store/dataroom-store'
import type { DataroomNode } from '@/types/dataroom'
import { RenameDialog } from '@/components/dataroom/dialogs/RenameDialog'
import { DeleteConfirmDialog } from '@/components/dataroom/dialogs/DeleteConfirmDialog'

interface FileTableProps {
  className?: string
}

interface FileRowProps {
  node: DataroomNode
  isSelected: boolean
  onSelect: (nodeId: string, selected: boolean) => void
}

function FileRow({ node, isSelected, onSelect }: FileRowProps) {
  const { navigateToFolder } = useDataroomStore()

  const handleDoubleClick = () => {
    if (node.type === 'folder') {
      navigateToFolder(node.id)
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
      className="cursor-pointer hover:bg-accent/50"
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

      <TableCell className="text-muted-foreground">
        {node.type === 'file' ? node.mimeType : 'Folder'}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {node.type === 'file' ? formatFileSize(node.size) : '-'}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {formatDate(node.updatedAt)}
      </TableCell>

      <TableCell className="w-12">
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
            {node.type === 'file' && (
              <>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <RenameDialog nodeId={node.id} currentName={node.name}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
            </RenameDialog>
            <DeleteConfirmDialog nodeId={node.id} nodeName={node.name}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DeleteConfirmDialog>
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
  } = useDataroomStore()

  const nodes = getChildNodes(currentFolderId)
  const [allSelected, setAllSelected] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectMultiple(nodes.map((node) => node.id))
      setAllSelected(true)
    } else {
      clearSelection()
      setAllSelected(false)
    }
  }

  const handleSelectNode = (nodeId: string, selected: boolean) => {
    if (selected) {
      const newSelection = [...selectedNodeIds, nodeId]
      selectMultiple(newSelection)
      setAllSelected(newSelection.length === nodes.length)
    } else {
      const newSelection = selectedNodeIds.filter((id) => id !== nodeId)
      selectMultiple(newSelection)
      setAllSelected(false)
    }
  }

  if (nodes.length === 0) {
    return (
      <div
        className={`flex flex-col flex-1 h-full items-center justify-center py-12 text-muted-foreground ${className}`}
      >
        <Upload className="h-10 w-10  mb-4" />
        <p className="mb-4">Drop PDF files here</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="w-12"></TableHead>
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
  )
}
