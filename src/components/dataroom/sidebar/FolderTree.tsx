'use client'

import * as React from 'react'
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { useDataroomStore } from '@/store/dataroom-store'
import type { Folder as FolderType } from '@/types/dataroom'

interface FolderTreeProps {
  className?: string
}

export function FolderTree({ className }: FolderTreeProps) {
  const { rootFolderId } = useDataroomStore()

  return (
    <div className={className}>
      <SidebarMenu>
        <FolderTreeNode folderId={rootFolderId} />
      </SidebarMenu>
    </div>
  )
}

function FolderTreeNode({ folderId }: { folderId: string }) {
  const { nodes, currentFolderId, navigateToFolder, getChildNodes, selectNode } =
    useDataroomStore()
  const [isOpen, setIsOpen] = React.useState(folderId === 'root')

  const folder = nodes[folderId] as FolderType
  const isActive = currentFolderId === folderId
  const allChildNodes = getChildNodes(folderId)
  const childFolders = allChildNodes.filter((node) => node.type === 'folder')
  const childFiles = allChildNodes.filter((node) => node.type === 'file')
  const hasChildren = allChildNodes.length > 0

  if (!folder || folder.type !== 'folder') {
    return null
  }

  const handleNavigate = () => {
    navigateToFolder(folderId)
    if (hasChildren && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleFileClick = (fileId: string) => {
    // Navigate to the folder containing the file and select it
    navigateToFolder(folderId)
    selectNode(fileId)
  }

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          onClick={handleNavigate}
          className="data-[active=true]:bg-accent"
        >
          <Folder className="h-4 w-4" />
          {folder.name}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <SidebarMenuButton
          isActive={isActive}
          onClick={handleNavigate}
          className="data-[active=true]:bg-accent cursor-pointer"
        >
          <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
            <ChevronRight className="transition-transform cursor-pointer" />
          </CollapsibleTrigger>
          {isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          {folder.name}
        </SidebarMenuButton>

        <CollapsibleContent>
          <SidebarMenuSub>
            {childFolders.map((childFolder) => (
              <FolderTreeNode key={childFolder.id} folderId={childFolder.id} />
            ))}

            {/* Render files */}
            {childFiles.map((file) => (
              <SidebarMenuItem key={file.id}>
                <SidebarMenuButton
                  onClick={() => handleFileClick(file.id)}
                  className=" text-sm text-ellipsis cursor-pointer"
                >
                  <File className="h-4 w-4 text-gray-500" />
                  <span>{file.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
