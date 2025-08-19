'use client'

import { Search, Upload, Plus, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderTree } from './sidebar/FolderTree'
import { FileTable } from './content/FileTable'
import { Breadcrumbs } from './breadcrumbs/Breadcrumbs'
import { useDataroomStore } from '@/store/dataroom-store'

interface DataroomLayoutProps {
  className?: string
}

export function DataroomLayout({ className }: DataroomLayoutProps) {
  const { searchQuery, setSearchQuery, createFolder, currentFolderId, uploadFile } =
    useDataroomStore()

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:')
    if (name?.trim()) {
      createFolder(name.trim(), currentFolderId)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      uploadFile(file, currentFolderId)
    })

    // Reset input
    event.target.value = ''
  }

  return (
    <div className={`flex h-screen bg-background ${className}`}>
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleCreateFolder}
              className="w-full justify-start"
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

            <div className="relative">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              />
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>

          {/* Folder Tree */}
          <FolderTree />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between space-x-4">
            {/* Breadcrumbs */}
            <Breadcrumbs className="flex-1" />

            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* File Table */}
        <div className="flex-1 p-4 overflow-auto">
          <FileTable />
        </div>
      </div>
    </div>
  )
}
