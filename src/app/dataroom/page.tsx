'use client'

import SignOutButton from '@/components/auth/sign-out-button'
import { Search } from '@/components/dataroom/search'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { FileTable } from '@/components/dataroom/content/FileTable'
import { CreateFolderDialog } from '@/components/dataroom/dialogs/CreateFolderDialog'
import { RenameDialog } from '@/components/dataroom/dialogs/RenameDialog'
import { DeleteConfirmDialog } from '@/components/dataroom/dialogs/DeleteConfirmDialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ChevronDown, FolderPen, FolderPlus, FolderX, Home } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useDataroomStore } from '@/store/dataroom-store'

export default function DataroomPage() {
  const { breadcrumbs, navigateToFolder, currentFolderId } = useDataroomStore()

  const handleDeleteComplete = () => {
    // Navigate to parent after deletion
    if (breadcrumbs.length > 1) {
      const parent = breadcrumbs[breadcrumbs.length - 2]
      navigateToFolder(parent.id)
    }
  }

  const currentFolder = breadcrumbs[breadcrumbs.length - 1]
  const canModify = currentFolder?.id !== 'root'

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '20rem',
        '--sidebar-width-mobile': '20rem',
      }}
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
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.id} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}

                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbItem>
                        <BreadcrumbPage className="hover:bg-muted-foreground/30 px-3 py-2 rounded-md transition cursor-pointer">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="flex gap-1 items-center">
                                {index === 0 ? <Home className="h-4 w-4 mr-1" /> : null}
                                {breadcrumb.name}
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 mt-2" align="start">
                              <DropdownMenuGroup>
                                <CreateFolderDialog parentId={currentFolderId}>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    New Folder
                                    <DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
                                  </DropdownMenuItem>
                                </CreateFolderDialog>
                                {canModify && (
                                  <RenameDialog
                                    nodeId={currentFolder.id}
                                    currentName={currentFolder.name}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <FolderPen className="h-4 w-4 mr-2" />
                                      Rename
                                      <DropdownMenuShortcut>⇧⌘R</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                  </RenameDialog>
                                )}
                              </DropdownMenuGroup>
                              {canModify && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuGroup>
                                    <DeleteConfirmDialog
                                      nodeId={currentFolder.id}
                                      nodeName={currentFolder.name}
                                      onConfirm={handleDeleteComplete}
                                    >
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <FolderX className="h-4 w-4 mr-2" />
                                        Delete
                                        <DropdownMenuShortcut>DEL</DropdownMenuShortcut>
                                      </DropdownMenuItem>
                                    </DeleteConfirmDialog>
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
                            navigateToFolder(breadcrumb.id)
                          }}
                          className="flex items-center"
                        >
                          {index === 0 && <Home className="h-4 w-4 mr-1" />}
                          {breadcrumb.name}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    )}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <Search />
            <SignOutButton />
          </div>
        </header>

        <div className="flex-1 p-4 overflow-auto">
          <FileTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
