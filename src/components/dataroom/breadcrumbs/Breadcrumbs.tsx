'use client'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDialog } from '@/contexts/DialogContext'
import { useDataroomStore } from '@/store/dataroom-store'
import { ChevronDown, Copy, FolderPen, FolderPlus, FolderX, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface BreadcrumbsProps {
  className?: string
  onDeleteComplete?: () => void
}

export function Breadcrumbs({ className, onDeleteComplete }: BreadcrumbsProps) {
  const { breadcrumbs, navigateToFolder, currentFolderId, dataroom } = useDataroomStore()
  const { openDialog } = useDialog()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [ellipsisDropdownOpen, setEllipsisDropdownOpen] = useState(false)

  const handleDeleteComplete = () => {
    setDropdownOpen(false) // Close dropdown when delete completes
    if (onDeleteComplete) {
      onDeleteComplete()
    } else {
      if (breadcrumbs.length > 1) {
        const parent = breadcrumbs[breadcrumbs.length - 2]
        navigateToFolder(parent.id)
      }
    }
  }

  const currentFolder = breadcrumbs[breadcrumbs.length - 1]
  const canModify = currentFolder?.id !== 'root'

  const handleCopyShareLink = async () => {
    if (!dataroom?.shareToken) return

    const shareUrl = `${window.location.origin}/share/${dataroom.shareToken}`
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch (error) {
      console.error('Failed to copy share link:', error)
    }
  }

  const handleBreadcrumbClick = (breadcrumbId: string) => {
    if (!dataroom) return

    navigateToFolder(breadcrumbId)
    const breadcrumbIndex = breadcrumbs.findIndex((b) => b.id === breadcrumbId)
    if (breadcrumbIndex >= 0) {
      const pathSegments = breadcrumbs
        .slice(1, breadcrumbIndex + 1)
        .map((crumb) => encodeURIComponent(crumb.name))

      const basePath =
        pathSegments.length > 0
          ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
          : `/dataroom/${dataroom.id}`

      const { selectedNodeIds } = useDataroomStore.getState()
      const searchParams = new URLSearchParams()
      if (selectedNodeIds.length > 0) {
        searchParams.set('selected', selectedNodeIds.join(','))
      }

      const newPath = searchParams.toString()
        ? `${basePath}?${searchParams.toString()}`
        : basePath

      router.push(newPath)
    }
  }

  const truncateName = (name: string, maxLength = 25) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }

  const getVisibleBreadcrumbs = () => {
    if (breadcrumbs.length <= 4) {
      return breadcrumbs
    }

    return [
      breadcrumbs[0],
      { id: 'ellipsis', name: '...', path: '' },
      breadcrumbs[breadcrumbs.length - 2],
      breadcrumbs[breadcrumbs.length - 1],
    ]
  }

  const getHiddenBreadcrumbs = () => {
    if (breadcrumbs.length <= 4) {
      return []
    }
    return breadcrumbs.slice(1, breadcrumbs.length - 2)
  }

  const visibleBreadcrumbs = getVisibleBreadcrumbs()

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {visibleBreadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.id} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}

            {breadcrumb.id === 'ellipsis' ? (
              <BreadcrumbItem>
                <DropdownMenu
                  open={ellipsisDropdownOpen}
                  onOpenChange={setEllipsisDropdownOpen}
                >
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                    <span className="sr-only">Show path</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {getHiddenBreadcrumbs().map((hiddenBreadcrumb) => (
                      <DropdownMenuItem
                        key={hiddenBreadcrumb.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          handleBreadcrumbClick(hiddenBreadcrumb.id)
                          setEllipsisDropdownOpen(false)
                        }}
                      >
                        {truncateName(hiddenBreadcrumb.name)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            ) : index === visibleBreadcrumbs.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage className="hover:bg-muted-foreground/30 px-2 py-2 -ml-2 rounded-md transition cursor-pointer">
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <div className="flex gap-1 items-center">
                        {index === 0 ? <Home className="h-4 w-4 mr-1" /> : null}
                        {truncateName(breadcrumb.name)}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mt-2" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => {
                            openDialog('createFolder', { parentId: currentFolderId })
                          }}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          New Folder
                          <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        {canModify && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => {
                              openDialog('rename', {
                                nodeId: currentFolder.id,
                                currentName: currentFolder.name,
                              })
                            }}
                          >
                            <FolderPen className="h-4 w-4 mr-2" />
                            Rename
                            <DropdownMenuShortcut>⇧⌘R</DropdownMenuShortcut>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      {dataroom?.shareToken && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={handleCopyShareLink}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Share Link
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                      {canModify && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onSelect={() => {
                                openDialog('delete', {
                                  nodeId: currentFolder.id,
                                  nodeName: currentFolder.name,
                                  onConfirm: handleDeleteComplete,
                                })
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <FolderX className="h-4 w-4 mr-2 text-destructive" />
                              Delete
                              <DropdownMenuShortcut>DEL</DropdownMenuShortcut>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleBreadcrumbClick(breadcrumb.id)
                  }}
                  className="flex items-center"
                >
                  {index === 0 && <Home className="h-4 w-4 mr-1" />}
                  {truncateName(breadcrumb.name)}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
