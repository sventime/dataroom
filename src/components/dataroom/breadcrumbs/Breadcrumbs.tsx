'use client'

import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDataroomStore } from '@/store/dataroom-store'
import type { Breadcrumb } from '@/types/dataroom'

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs, navigateToFolder, createFolder, currentFolderId } = useDataroomStore()

  const handleNavigate = (breadcrumb: Breadcrumb) => {
    navigateToFolder(breadcrumb.id)
  }

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:')
    if (name?.trim()) {
      createFolder(name.trim(), currentFolderId)
    }
  }

  const handleRename = () => {
    const currentFolder = breadcrumbs[breadcrumbs.length - 1]
    if (currentFolder && currentFolder.id !== 'root') {
      const newName = prompt('Enter new name:', currentFolder.name)
      if (newName?.trim() && newName !== currentFolder.name) {
        useDataroomStore.getState().renameNode(currentFolder.id, newName.trim())
      }
    }
  }

  const handleDelete = () => {
    const currentFolder = breadcrumbs[breadcrumbs.length - 1]
    if (currentFolder && currentFolder.id !== 'root') {
      if (confirm(`Are you sure you want to delete "${currentFolder.name}"?`)) {
        useDataroomStore.getState().deleteNode(currentFolder.id)
        // Navigate to parent after deletion
        if (breadcrumbs.length > 1) {
          const parent = breadcrumbs[breadcrumbs.length - 2]
          navigateToFolder(parent.id)
        }
      }
    }
  }

  const currentFolder = breadcrumbs[breadcrumbs.length - 1]
  const canModify = currentFolder?.id !== 'root'

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-1 flex-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.id} className="flex items-center space-x-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            
            <Button
              variant={index === breadcrumbs.length - 1 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigate(breadcrumb)}
              className="h-8 px-2"
            >
              {index === 0 ? (
                <Home className="h-4 w-4" />
              ) : (
                breadcrumb.name
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCreateFolder}>
            New Folder
          </DropdownMenuItem>
          
          {canModify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRename}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}