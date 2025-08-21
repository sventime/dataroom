'use client'

import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface FolderTreeProps {
  className?: string
}

export function FolderTree({ className }: FolderTreeProps) {
  const { nodes } = useDataroomStore()

  const rootFolder = Object.values(nodes).find(
    (node) => node.parentId === null && node.type === 'folder',
  )
  const rootFolderId = rootFolder?.id

  if (!rootFolderId) {
    return (
      <div className={className}>
        <div className="px-2 py-4 text-sm text-muted-foreground">No folders found</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <SidebarMenu>
        <FolderTreeNode folderId={rootFolderId} />
      </SidebarMenu>
    </div>
  )
}

function FolderTreeNode({ folderId }: { folderId: string }) {
  const {
    nodes,
    currentFolderId,
    navigateToFolder,
    getChildNodes,
    dataroom,
    getNodePath,
    isFolderExpanded,
    toggleFolderExpansion,
  } = useDataroomStore()
  const router = useRouter()

  const isOpen = isFolderExpanded(folderId)

  const folder = nodes[folderId]
  const isActive = currentFolderId === folderId
  const allChildNodes = getChildNodes(folderId)
  const childFolders = allChildNodes.filter((node) => node.type === 'folder')
  const childFiles = allChildNodes.filter((node) => node.type === 'file')
  const hasChildren = allChildNodes.length > 0

  if (!folder || folder.type !== 'folder') {
    return null
  }

  const handleNavigate = () => {
    if (!dataroom) return

    navigateToFolder(folderId)

    if (!isOpen) {
      toggleFolderExpansion(folderId)
    }
    const breadcrumbs = getNodePath(folderId)
    const pathSegments = breadcrumbs
      .slice(1)
      .map((crumb) => encodeURIComponent(crumb.name))

    const basePath =
      pathSegments.length > 0
        ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
        : `/dataroom/${dataroom.id}`

    router.push(basePath)
  }

  const handleFileClick = (fileId: string) => {
    if (!dataroom) return

    const newSelection = [fileId]

    const targetBreadcrumbs = getNodePath(folderId)
    const pathSegments = targetBreadcrumbs
      .slice(1)
      .map((crumb) => encodeURIComponent(crumb.name))

    const basePath =
      pathSegments.length > 0
        ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
        : `/dataroom/${dataroom.id}`

    const searchParams = new URLSearchParams()
    searchParams.set('selected', newSelection.join(','))

    const newPath = `${basePath}?${searchParams.toString()}`


    const store = useDataroomStore.getState()
    const { navigateToFolder: storeNavigateToFolder } = store
    storeNavigateToFolder(folderId)

    if (!isOpen) {
      toggleFolderExpansion(folderId)
    }

    router.replace(newPath)
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={() => toggleFolderExpansion(folderId)}
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
          <span className="truncate">{folder.name}</span>
        </SidebarMenuButton>

        <CollapsibleContent>
          <SidebarMenuSub>
            {childFolders.map((childFolder) => (
              <FolderTreeNode key={childFolder.id} folderId={childFolder.id} />
            ))}

            
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

            {!hasChildren && (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-muted-foreground/50">
                  Empty folder
                </div>
              </SidebarMenuItem>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
