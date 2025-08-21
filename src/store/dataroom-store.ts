import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DataroomApiClient, type ApiDataroom, type ApiDataroomNode } from '@/lib/api-client'
import type { DataroomNode, Breadcrumb } from '@/types/dataroom'
import { toast } from 'sonner'

interface DataroomState {
  dataroom: ApiDataroom | null
  nodes: Record<string, DataroomNode>
  currentFolderId: string | null
  breadcrumbs: Breadcrumb[]
  expandedFolders: Record<string, boolean>
  isLoading: boolean
  error: string | null
  searchQuery: string
  searchResults: string[]
  operationLoading: {
    createFolder: boolean
    renameNode: string | null
    deleteNode: string | null
    bulkDelete: boolean
    uploadFiles: boolean
  }
  isSharedMode: boolean
  shareToken: string | null
  sharedRootId: string | null
  isInitialized: boolean
}

interface DataroomActions {
  loadDataroom: () => Promise<void>
  loadDataroomById: (dataroomId: string) => Promise<void>
  loadSharedDataroom: (token: string) => Promise<void>
  processDataroomData: (dataroom: ApiDataroom) => void
  
  navigateToFolder: (folderId: string | null) => void
  navigateToPath: (pathSegments: string[]) => void
  
  createFolder: (name: string, parentId?: string) => Promise<{ conflicts?: unknown[] }>
  uploadFiles: (files: File[], parentId?: string) => Promise<{ conflicts?: unknown[] }>
  renameNode: (nodeId: string, newName: string) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  deleteBulk: (nodeIds: string[]) => Promise<void>
  
  
  setSearchQuery: (query: string) => void
  
  toggleFolderExpansion: (folderId: string) => void
  setFolderExpanded: (folderId: string, expanded: boolean) => void
  isFolderExpanded: (folderId: string) => boolean
  expandPathToFolder: (folderId: string) => void
  
  getChildNodes: (parentId: string | null) => DataroomNode[]
  getNodePath: (nodeId: string) => Breadcrumb[]
  getFolderByPath: (pathSegments: string[]) => DataroomNode | null
  isDescendantOfSharedRoot: (folderId: string | null) => boolean
  buildPathFromFolderId: (folderId: string | null) => string[]
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
  mimeType: apiNode.mimeType || 'application/octet-stream'
})

const initialState: DataroomState = {
  dataroom: null,
  nodes: {},
  currentFolderId: null,
  breadcrumbs: [],
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
  },
  isSharedMode: false,
  shareToken: null,
  sharedRootId: null,
  isInitialized: false,
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
        set({ isLoading: true, error: null, isSharedMode: false })
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

      loadSharedDataroom: async (token: string) => {
        set({ isLoading: true, error: null, isSharedMode: true, shareToken: token })
        
        try {
          const response = await fetch(`/api/share/${token}`)
          if (!response.ok) {
            throw new Error('Failed to fetch dataroom')
          }
          const data = await response.json()

          const sharedRootId = data.sharedFolderId || null
          
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Process the shared dataroom data
          const nodes: Record<string, DataroomNode> = {}
          
          data.dataroom.nodes.forEach((apiNode: ApiDataroomNode) => {
            const node = {
              id: apiNode.id,
              name: apiNode.name,
              type: apiNode.type.toLowerCase() as 'folder' | 'file',
              parentId: apiNode.parentId,
              children: [],
              size: apiNode.size || 0,
              createdAt: new Date(apiNode.createdAt),
              updatedAt: new Date(apiNode.updatedAt),
              mimeType: apiNode.mimeType || 'application/octet-stream'
            }
            nodes[apiNode.id] = node
          })

          Object.values(nodes).forEach(node => {
            if (node.type === 'folder') {
              node.children = Object.values(nodes)
                .filter(child => child.parentId === node.id)
                .map(child => child.id)
            }
          })

          set({
            dataroom: data.dataroom,
            nodes,
            sharedRootId,
            currentFolderId: sharedRootId,
            isLoading: false,
            isInitialized: true
          })

          const breadcrumbs = sharedRootId && nodes[sharedRootId] 
            ? [{ id: sharedRootId, name: nodes[sharedRootId].name, path: '/' }]
            : [{ id: 'shared-root', name: `Data Room (${data.dataroom.user?.email || data.dataroom.user?.name || 'Unknown'})`, path: '/' }]
          
          set({ breadcrumbs })
        } catch {
          set({
            error: 'This share link is invalid or has expired.',
            isLoading: false,
            isInitialized: true
          })
        }
      },

      processDataroomData: (dataroom: ApiDataroom) => {
        const { currentFolderId: existingCurrentFolderId } = get()
        const nodes: Record<string, DataroomNode> = {}
        
        const rootFolderName = `Data Room${dataroom.user?.email ? ` (${dataroom.user.email})` : ''}`
        nodes['root'] = {
          id: 'root',
          name: rootFolderName,
          type: 'folder',
          parentId: null,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        dataroom.nodes.forEach(apiNode => {
          const node = convertApiNode(apiNode)
          if (node.parentId === null) {
            node.parentId = 'root'
          }
          nodes[apiNode.id] = node
        })
        
        Object.values(nodes).forEach(node => {
          if (node.type === 'folder') {
            node.children = Object.values(nodes)
              .filter(child => child.parentId === node.id)
              .map(child => child.id)
          }
        })

        const currentFolderId = existingCurrentFolderId && nodes[existingCurrentFolderId] 
          ? existingCurrentFolderId 
          : 'root'
        
        set({
          dataroom,
          nodes,
          currentFolderId,
          isLoading: false
        })
        
        const breadcrumbs = currentFolderId === 'root' 
          ? [{ id: 'root', name: nodes['root']?.name || 'Data Room', path: '/' }]
          : get().getNodePath(currentFolderId)
        
        set({ breadcrumbs })
      },

      navigateToFolder: (folderId: string | null) => {
        const { nodes, isSharedMode, sharedRootId } = get()
        
        if (isSharedMode && folderId === null && sharedRootId === null) {
          set({
            currentFolderId: null,
            error: null
          })
          return
        }
        
        if (folderId) {
          const folder = nodes[folderId]
          
          if (!folder || folder.type !== 'folder') {
            return set({ error: 'Folder not found' })
          }

          const breadcrumbs = get().getNodePath(folderId)
          
          if (!isSharedMode) {
            get().expandPathToFolder(folderId)
          }
          
          set({
            currentFolderId: folderId,
            breadcrumbs,
            error: null
          })
        }
      },

      navigateToPath: (pathSegments: string[]) => {
        const { isSharedMode, sharedRootId } = get()
        const folder = get().getFolderByPath(pathSegments)
        
        if (folder) {
          get().navigateToFolder(folder.id)
        } else {
          if (isSharedMode) {
            get().navigateToFolder(sharedRootId) // null for root sharing
          } else {
            get().navigateToFolder('root')
          }
        }
      },

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
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload files'
          set({ 
            error: errorMessage
          })
          toast('Upload failed', {
            description: errorMessage
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

      expandPathToFolder: (folderId: string) => {
        const { nodes, expandedFolders } = get()
        const newExpandedFolders = { ...expandedFolders }
        
        let current = nodes[folderId]
        while (current && current.parentId) {
          const parent = nodes[current.parentId]
          if (parent && parent.type === 'folder') {
            newExpandedFolders[parent.id] = true
          }
          current = parent
        }
        
        if (nodes[folderId]?.type === 'folder') {
          newExpandedFolders[folderId] = true
        }
        
        set({ expandedFolders: newExpandedFolders })
      },

      getChildNodes: (parentId: string | null) => {
        const { nodes } = get()
        return Object.values(nodes)
          .filter(node => node.parentId === parentId)
          .sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1
            }
            return a.updatedAt.getTime() - b.updatedAt.getTime()
          })
      },

      getNodePath: (nodeId: string): Breadcrumb[] => {
        const { nodes, isSharedMode, sharedRootId, dataroom } = get()
        const path: Breadcrumb[] = []
        let current: DataroomNode | null = nodes[nodeId] || null

        while (current) {
          path.unshift({
            id: current.id,
            name: current.name,
            path: '/' + path.map(p => p.name).join('/')
          })

          if (isSharedMode && current.id === sharedRootId) {
            break
          }

          current = current.parentId ? nodes[current.parentId] || null : null
        }

        if (isSharedMode) {
          if (sharedRootId && nodes[sharedRootId]) {
            return path
          } else {
            path.unshift({
              id: 'shared-root',
              name: `Data Room (${dataroom?.owner?.email || dataroom?.owner?.name || 'Unknown'})`,
              path: '/'
            })
          }
        }

        return path
      },

      getFolderByPath: (pathSegments: string[]): DataroomNode | null => {
        const { nodes, isSharedMode, sharedRootId } = get()
        
        let currentFolder: DataroomNode | null
        
        if (isSharedMode) {
          currentFolder = sharedRootId ? nodes[sharedRootId] : null
          
          if (pathSegments.length === 0) {
            return currentFolder
          }
        } else {
          currentFolder = nodes['root']
          if (!currentFolder) return null

          if (pathSegments.length === 0) {
            return currentFolder
          }
        }

        for (const segment of pathSegments) {
          const decodedSegment = decodeURIComponent(segment)
          const children = get().getChildNodes(currentFolder?.id || null)
          const nextFolder = children.find(
            child => child.type === 'folder' && child.name === decodedSegment
          )
          
          if (!nextFolder) {
            return null
          }
          
          currentFolder = nextFolder
        }

        return currentFolder
      },

      isDescendantOfSharedRoot: (folderId: string | null) => {
        const { nodes, sharedRootId, isSharedMode } = get()
        if (!isSharedMode) return true

        if (!sharedRootId) return true

        if (folderId === sharedRootId) return true
        if (folderId === null) return sharedRootId === null

        let current = nodes[folderId || '']
        while (current) {
          if (current.id === sharedRootId) return true
          current = current.parentId ? nodes[current.parentId] || null : null
        }
        return false
      },

      buildPathFromFolderId: (folderId: string | null) => {
        const { nodes, sharedRootId, isSharedMode } = get()
        if (!isSharedMode || folderId === sharedRootId) return []

        const pathSegments: string[] = []
        let current = nodes[folderId || '']

        while (current && current.id !== sharedRootId) {
          pathSegments.unshift(encodeURIComponent(current.name))
          current = current.parentId ? nodes[current.parentId] || null : null
        }

        return pathSegments
      },

      reset: () => {
        set(initialState)
      }
    }),
    { name: 'dataroom-store' }
  )
)