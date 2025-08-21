'use client'

import { File, FileText, Folder } from 'lucide-react'
import * as React from 'react'
import { useRouter } from 'next/navigation'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useDataroomStore } from '@/store/dataroom-store'

export function Search() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    nodes,
    navigateToFolder,
    dataroom,
    getNodePath,
  } = useDataroomStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleSelectItem = (nodeId: string) => {
    const node = nodes[nodeId]
    if (!node || !dataroom) return

    if (node.type === 'folder') {
      // Navigate to folder (will auto-expand path)
      navigateToFolder(nodeId)
      
      const breadcrumbs = getNodePath(nodeId)
      const pathSegments = breadcrumbs
        .slice(1)
        .map((crumb) => encodeURIComponent(crumb.name))

      const basePath =
        pathSegments.length > 0
          ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
          : `/dataroom/${dataroom.id}`

      router.push(basePath)
    } else {
      // For files, navigate to parent folder and select the file
      if (node.parentId) {
        // Navigate to parent folder (will auto-expand path) and select the file
        navigateToFolder(node.parentId)
        
        const breadcrumbs = getNodePath(node.parentId)
        const pathSegments = breadcrumbs
          .slice(1)
          .map((crumb) => encodeURIComponent(crumb.name))

        const basePath =
          pathSegments.length > 0
            ? `/dataroom/${dataroom.id}/${pathSegments.join('/')}`
            : `/dataroom/${dataroom.id}`

        const searchParams = new URLSearchParams()
        searchParams.set('selected', nodeId)

        const newPath = `${basePath}?${searchParams.toString()}`
        router.push(newPath)
      }
    }

    setOpen(false)
    setSearchQuery('')
  }

  const searchResultNodes = searchResults.map((id) => nodes[id]).filter(Boolean)
  const folders = searchResultNodes.filter((node) => node.type === 'folder')
  const files = searchResultNodes.filter((node) => node.type === 'file')


  const truncateName = (name: string, maxLength = 25) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }

  const truncatePath = (pathArray: string[]): string => {
    if (pathArray.length === 0) return 'Data Room'
    if (pathArray.length <= 3) {
      return pathArray.join(' / ')
    }

    // Show first folder + ... + last two folders
    const first = pathArray[0]
    const lastTwo = pathArray.slice(-2)
    return `${first} / ... / ${lastTwo.join(' / ')}`
  }

  return (
    <>
      <div
        className="text-muted-foreground text-sm bg-input/60 border-border border p-2 px-4 rounded-md flex gap-4 cursor-pointer hover:bg-input/80 transition-colors"
        onClick={() => setOpen(true)}
      >
        <span>Search...</span>
        <div className="flex items-center gap-1">
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1 font-mono text-[10px] font-medium opacity-100 select-none">
            <span className="text-xs">⌘</span>
          </kbd>
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
            K
          </kbd>
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type file or folder name to search..."
          value={searchQuery}
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>Start typing to search for file or folder.</CommandEmpty>

          {folders.length > 0 && (
            <>
              <CommandGroup heading="Folders">
                {folders.map((folder) => {
                  const breadcrumbs = getNodePath(folder.id)
                  const pathNames = breadcrumbs.slice(1).map(crumb => crumb.name) // Skip root
                  return (
                    <CommandItem
                      key={folder.id}
                      onSelect={() => handleSelectItem(folder.id)}
                      className="flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4 " />
                      <span>{truncateName(folder.name)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {truncatePath(pathNames)}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {files.length > 0 && (
            <>
              {folders.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Files">
                {files.map((file) => {
                  const breadcrumbs = getNodePath(file.id)
                  const pathNames = breadcrumbs.slice(1).map(crumb => crumb.name) // Skip root
                  return (
                    <CommandItem
                      key={file.id}
                      onSelect={() => handleSelectItem(file.id)}
                      className="flex items-center gap-2"
                    >
                      {file.mimeType?.includes('pdf') ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : file.mimeType?.includes('image') ? (
                        <File className="h-4 w-4 text-green-500" />
                      ) : (
                        <File className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{truncateName(file.name)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {truncatePath(pathNames)}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <CommandEmpty>No files or folders found for &quot;{searchQuery}&quot;.</CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
