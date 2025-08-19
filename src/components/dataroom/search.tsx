'use client'

import * as React from 'react'
import { File, Folder, FileText } from 'lucide-react'

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
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    nodes,
    navigateToFolder,
    selectNode,
    clearSearch,
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
    if (!node) return

    if (node.type === 'folder') {
      navigateToFolder(nodeId)
    } else {
      // For files, navigate to parent folder and select the file
      if (node.parentId) {
        navigateToFolder(node.parentId)
        selectNode(nodeId)
      }
    }

    setOpen(false)
    clearSearch()
  }

  const searchResultNodes = searchResults.map((id) => nodes[id]).filter(Boolean)
  const folders = searchResultNodes.filter((node) => node.type === 'folder')
  const files = searchResultNodes.filter((node) => node.type === 'file')

  return (
    <>
      <p
        className="text-muted-foreground text-sm bg-input/60 border-border border p-2 px-4 rounded-md flex gap-4 cursor-pointer hover:bg-input/80 transition-colors"
        onClick={() => setOpen(true)}
      >
        <span>Search in Data Room...</span>
        <div className="flex items-center gap-1">
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1 font-mono text-[10px] font-medium opacity-100 select-none">
            <span className="text-xs">⌘</span>
          </kbd>
          <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-3 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
            K
          </kbd>
        </div>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type file or folder name to search..."
          value={searchQuery}
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No files or folders found.</CommandEmpty>

          {folders.length > 0 && (
            <>
              <CommandGroup heading="Folders">
                {folders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    onSelect={() => handleSelectItem(folder.id)}
                    className="flex items-center gap-2"
                  >
                    <Folder className="h-4 w-4 " />
                    <span>{folder.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {folder.parentId === 'root' ? 'Data Room' : 'Folder'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {files.length > 0 && (
            <>
              {folders.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Files">
                {files.map((file) => (
                  <CommandItem
                    key={file.id}
                    onSelect={() => handleSelectItem(file.id)}
                    className="flex items-center gap-2"
                  >
                    {file.mimeType.includes('pdf') ? (
                      <FileText className="h-4 w-4 text-red-500" />
                    ) : file.mimeType.includes('image') ? (
                      <File className="h-4 w-4 text-green-500" />
                    ) : (
                      <File className="h-4 w-4 text-gray-500" />
                    )}
                    <span>{file.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {file.mimeType}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <CommandEmpty>No files or folders found for "{searchQuery}".</CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
