'use client'

import { Upload } from 'lucide-react'
import * as React from 'react'

import { CreateFolderDialog } from '@/components/dataroom/dialogs/CreateFolderDialog'
import { FolderTree } from '@/components/dataroom/sidebar/FolderTree'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useDataroomStore } from '@/store/dataroom-store'
import { useEffect, useRef } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentFolderId, nodes } = useDataroomStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const fileArray = Array.from(files)

    // Emit custom event to notify parent components about file uploads
    const uploadEvent = new CustomEvent('fileUpload', {
      detail: { files: fileArray, parentId: currentFolderId },
    })
    window.dispatchEvent(uploadEvent)

    // Reset input
    event.target.value = ''
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === '.') {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Sidebar {...props}>
      <SidebarContent>
        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <CreateFolderDialog />

              <div className="relative">
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                />
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  <div className="flex justify-between items-center flex-1">
                    Upload Files{' '}
                    <span className="text-muted-foreground text-xs tracking-widest">
                      ⌘{'.'}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Folder Tree */}
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <DataroomTree />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function DataroomTree() {
  return <FolderTree />
}
