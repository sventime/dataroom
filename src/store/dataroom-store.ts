import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DataroomApiClient, type ApiDataroom, type ApiDataroomNode } from '@/lib/api-client'
import type { DataroomNode, Breadcrumb } from '@/types/dataroom'

interface DataroomState {
  dataroom: ApiDataroom | null
  nodes: Record<string, DataroomNode>
  currentFolderId: string | null
  breadcrumbs: Breadcrumb[]
  selectedNodeIds: string[]
  expandedFolders: Record<string, boolean> // Track which folders are expanded
  isLoading: boolean
  error: string | null
  searchQuery: string
  searchResults: string[]
  operationLoading: {
    createFolder: boolean
    renameNode: string | null // nodeId being renamed
    deleteNode: string | null // nodeId being deleted
    bulkDelete: boolean
    uploadFiles: boolean
  }
}

interface DataroomActions {
  loadDataroom: () => Promise<void>
  loadDataroomById: (dataroomId: string) => Promise<void>
  processDataroomData: (dataroom: ApiDataroom) => void
  
  navigateToFolder: (folderId: string) => void
  navigateToPath: (pathSegments: string[]) => void
  
  createFolder: (name: string, parentId?: string) => Promise<{ conflicts?: any[] }>
  uploadFiles: (files: File[], parentId?: string) => Promise<{ conflicts?: any[] }>
  renameNode: (nodeId: string, newName: string) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  deleteBulk: (nodeIds: string[]) => Promise<void>
  
  selectNode: (nodeId: string) => void
  selectMultiple: (nodeIds: string[]) => void
  clearSelection: () => void
  
  setSearchQuery: (query: string) => void
  
  toggleFolderExpansion: (folderId: string) => void
  setFolderExpanded: (folderId: string, expanded: boolean) => void
  isFolderExpanded: (folderId: string) => boolean
  
  getChildNodes: (parentId: string | null) => DataroomNode[]
  getNodePath: (nodeId: string) => Breadcrumb[]
  getFolderByPath: (pathSegments: string[]) => DataroomNode | null
  reset: () => void
}

type DataroomStore = DataroomState & DataroomActions

const convertApiNode = (apiNode: ApiDataroomNode): DataroomNode => ({
  id: apiNode.id,
  name: apiNode.name,
  type: apiNode.type.toLowerCase() as 'folder' | 'file',
  parentId: apiNode.parentId,
  children: [],
  size: apiNode.size || 0,
  createdAt: new Date(apiNode.createdAt),
  updatedAt: new Date(apiNode.updatedAt),
  mimeType: apiNode.mimeType
})

const initialState: DataroomState = {
  dataroom: null,
  nodes: {},
  currentFolderId: null,
  breadcrumbs: [],
  selectedNodeIds: [],
  expandedFolders: { root: true },
  isLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  operationLoading: {
    createFolder: false,
    renameNode: null,
    deleteNode: null,
    bulkDelete: false,
    uploadFiles: false,
  }
}

export const useDataroomStore = create<DataroomStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadDataroom: async () => {
        set({ isLoading: true, error: null })
        try {
          const dataroom = await DataroomApiClient.getDataroom()
          get().processDataroomData(dataroom)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load dataroom',
            isLoading: false 
          })
        }
      },

      loadDataroomById: async (dataroomId: string) => {
        set({ isLoading: true, error: null })
        try {
          const dataroom = await DataroomApiClient.getDataroomById(dataroomId)
          get().processDataroomData(dataroom)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load dataroom',
            isLoading: false 
          })
        }
      },

      // Helper method to process dataroom data
      processDataroomData: (dataroom: ApiDataroom) => {
        const { currentFolderId: existingCurrentFolderId } = get()
        const nodes: Record<string, DataroomNode> = {}
        
        // Always add virtual root folder with user email
        const rootFolderName = `Data Room${dataroom.user?.email ? ` (${dataroom.user.email})` : ''}`
        nodes['root'] = {
          id: 'root',
          name: rootFolderName,
          type: 'folder',
          parentId: null,
          children: [],
          size: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Convert API nodes to internal format
        dataroom.nodes.forEach(apiNode => {
          const node = convertApiNode(apiNode)
          // If this is a root-level node (parentId is null), make it a child of our virtual root
          if (node.parentId === null) {
            node.parentId = 'root'
          }
          nodes[apiNode.id] = node
        })
        
        // Populate children arrays
        Object.values(nodes).forEach(node => {
          if (node.type === 'folder') {
            node.children = Object.values(nodes)
              .filter(child => child.parentId === node.id)
              .map(child => child.id)
          }
        })

        // Preserve current folder if it still exists, otherwise go to root
        const currentFolderId = existingCurrentFolderId && nodes[existingCurrentFolderId] 
          ? existingCurrentFolderId 
          : 'root'
        
        // Set nodes first, then calculate breadcrumbs
        set({
          dataroom,
          nodes,
          currentFolderId,
          isLoading: false
        })
        
        // Calculate breadcrumbs after nodes are set
        const breadcrumbs = currentFolderId === 'root' 
          ? [{ id: 'root', name: nodes['root']?.name || 'Data Room', path: '/' }]
          : get().getNodePath(currentFolderId)
        
        set({ breadcrumbs })
      },

      // Navigation
      navigateToFolder: (folderId: string) => {
        const { nodes } = get()
        const folder = nodes[folderId]
        
        if (!folder || folder.type !== 'folder') {
          return set({ error: 'Folder not found' })
        }

        const breadcrumbs = get().getNodePath(folderId)
        
        set({
          currentFolderId: folderId,
          breadcrumbs,
          selectedNodeIds: [],
          error: null
        })
      },

      navigateToPath: (pathSegments: string[]) => {
        const folder = get().getFolderByPath(pathSegments)
        if (folder) {
          get().navigateToFolder(folder.id)
        } else {
          // Path not found, navigate to root
          get().navigateToFolder('root')
        }
      },

      // CRUD operations
      createFolder: async (name: string, parentId?: string) => {
        const { dataroom, currentFolderId } = get()
        if (!dataroom) return

        const targetParentId = parentId || currentFolderId
        
        try {
          set({ 
            operationLoading: { ...get().operationLoading, createFolder: true },
            error: null 
          })
          const apiParentId = targetParentId === 'root' ? null : targetParentId
          await DataroomApiClient.createFolder(name, apiParentId, dataroom.id)
          await get().loadDataroomById(dataroom.id)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create folder'
          })
          throw error
        } finally {
          set({ 
            operationLoading: { ...get().operationLoading, createFolder: false }
          })
        }
      },

      uploadFiles: async (files: File[], parentId?: string) => {
        const { dataroom, currentFolderId } = get()
        if (!dataroom) return { conflicts: [] }

        const targetParentId = parentId || currentFolderId
        try {
          set({ 
            operationLoading: { ...get().operationLoading, uploadFiles: true },
            error: null 
          })
          const apiParentId = targetParentId === 'root' ? null : targetParentId
          const result = await DataroomApiClient.uploadFiles(files, apiParentId, dataroom.id)
          await get().loadDataroomById(dataroom.id)
          return { conflicts: result.conflicts }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upload files'
          })
          throw error
        } finally {
          set({ 
            operationLoading: { ...get().operationLoading, uploadFiles: false }
          })
        }
      },

      renameNode: async (nodeId: string, newName: string) => {
        try {
          set({ 
            operationLoading: { ...get().operationLoading, renameNode: nodeId },
            error: null 
          })
          await DataroomApiClient.renameNode(nodeId, newName)
          await get().loadDataroomById(get().dataroom!.id)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to rename node'
          })
          throw error
        } finally {
          set({ 
            operationLoading: { ...get().operationLoading, renameNode: null }
          })
        }
      },

      deleteNode: async (nodeId: string) => {
        try {
          set({ 
            operationLoading: { ...get().operationLoading, deleteNode: nodeId },
            error: null 
          })
          await DataroomApiClient.deleteNode(nodeId)
          await get().loadDataroomById(get().dataroom!.id)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete node'
          })
          throw error
        } finally {
          set({ 
            operationLoading: { ...get().operationLoading, deleteNode: null }
          })
        }
      },

      deleteBulk: async (nodeIds: string[]) => {
        try {
          set({ 
            operationLoading: { ...get().operationLoading, bulkDelete: true },
            error: null 
          })
          await DataroomApiClient.bulkDelete(nodeIds)
          set({ selectedNodeIds: [] })
          await get().loadDataroomById(get().dataroom!.id)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete nodes'
          })
          throw error
        } finally {
          set({ 
            operationLoading: { ...get().operationLoading, bulkDelete: false }
          })
        }
      },

      // Selection
      selectNode: (nodeId: string) => {
        const { selectedNodeIds } = get()
        const newSelection = selectedNodeIds.includes(nodeId)
          ? selectedNodeIds.filter(id => id !== nodeId)
          : [...selectedNodeIds, nodeId]
        
        set({ selectedNodeIds: newSelection })
      },

      selectMultiple: (nodeIds: string[]) => {
        set({ selectedNodeIds: nodeIds })
      },

      clearSelection: () => {
        set({ selectedNodeIds: [] })
      },

      // Search
      setSearchQuery: (query: string) => {
        const { nodes } = get()
        if (!query.trim()) {
          set({ searchQuery: '', searchResults: [] })
          return
        }

        const results = Object.values(nodes)
          .filter(node => 
            node.name.toLowerCase().includes(query.toLowerCase())
          )
          .map(node => node.id)

        set({ searchQuery: query, searchResults: results })
      },

      // Folder expansion
      toggleFolderExpansion: (folderId: string) => {
        const { expandedFolders } = get()
        const isExpanded = expandedFolders[folderId] || false
        set({
          expandedFolders: {
            ...expandedFolders,
            [folderId]: !isExpanded
          }
        })
      },

      setFolderExpanded: (folderId: string, expanded: boolean) => {
        const { expandedFolders } = get()
        set({
          expandedFolders: {
            ...expandedFolders,
            [folderId]: expanded
          }
        })
      },

      isFolderExpanded: (folderId: string) => {
        const { expandedFolders } = get()
        return expandedFolders[folderId] || false
      },

      // Utility
      getChildNodes: (parentId: string | null) => {
        const { nodes } = get()
        return Object.values(nodes)
          .filter(node => node.parentId === parentId)
          .sort((a, b) => {
            // Folders first, then files, both alphabetically
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1
            }
            return a.name.localeCompare(b.name)
          })
      },

      getNodePath: (nodeId: string): Breadcrumb[] => {
        const { nodes } = get()
        const path: Breadcrumb[] = []
        let current = nodes[nodeId]

        while (current) {
          path.unshift({
            id: current.id,
            name: current.name,
            path: '/' + path.map(p => p.name).join('/')
          })

          current = current.parentId ? nodes[current.parentId] : null
        }

        return path
      },

      getFolderByPath: (pathSegments: string[]): DataroomNode | null => {
        const { nodes } = get()
        
        // Start from root
        let currentFolder = nodes['root']
        if (!currentFolder) return null

        // If no path segments, return root
        if (pathSegments.length === 0) {
          return currentFolder
        }

        // Navigate through each path segment
        for (const segment of pathSegments) {
          const decodedSegment = decodeURIComponent(segment)
          const children = get().getChildNodes(currentFolder.id)
          const nextFolder = children.find(
            child => child.type === 'folder' && child.name === decodedSegment
          )
          
          if (!nextFolder) {
            return null // Path segment not found
          }
          
          currentFolder = nextFolder
        }

        return currentFolder
      },

      reset: () => {
        set(initialState)
      }
    }),
    { name: 'dataroom-store' }
  )
)