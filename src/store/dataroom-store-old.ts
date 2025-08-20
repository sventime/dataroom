import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { DataroomStore, DataroomNode, Folder, File, Breadcrumb } from '@/types/dataroom'

// Initial state factory
const createInitialState = (rootFolderName = 'Data Room') => {
  const rootFolderId = 'root'
  const rootFolder: Folder = {
    id: rootFolderId,
    name: rootFolderName,
    type: 'folder',
    children: [],
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return {
    nodes: { [rootFolderId]: rootFolder },
    rootFolderId,
    currentFolderId: rootFolderId,
    breadcrumbs: [{ id: rootFolderId, name: rootFolderName, path: '/' }],
    selectedNodeIds: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    searchResults: [],
  }
}

export const useDataroomStore = create<DataroomStore>()(
  devtools(
    (set, get) => ({
      ...createInitialState(),

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
          error: null,
        })
      },

      goBack: () => {
        const { breadcrumbs } = get()
        if (breadcrumbs.length > 1) {
          const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2]
          get().navigateToFolder(parentBreadcrumb.id)
        }
      },

      // Folder operations
      createFolder: (name: string, parentId?: string) => {
        const { nodes, currentFolderId } = get()
        const actualParentId = parentId || currentFolderId
        const parent = nodes[actualParentId]

        if (!parent || parent.type !== 'folder') {
          set({ error: 'Invalid parent folder' })
          return ''
        }

        const folderId = nanoid()
        const now = new Date()
        
        const newFolder: Folder = {
          id: folderId,
          name,
          type: 'folder',
          children: [],
          parentId: actualParentId,
          createdAt: now,
          updatedAt: now,
        }

        const updatedParent: Folder = {
          ...parent,
          children: [...parent.children, folderId],
          updatedAt: now,
        }

        set({
          nodes: {
            ...nodes,
            [folderId]: newFolder,
            [actualParentId]: updatedParent,
          },
          error: null,
        })

        return folderId
      },

      renameNode: (nodeId: string, newName: string) => {
        const { nodes } = get()
        const node = nodes[nodeId]

        if (!node) {
          return set({ error: 'Node not found' })
        }

        set({
          nodes: {
            ...nodes,
            [nodeId]: {
              ...node,
              name: newName,
              updatedAt: new Date(),
            },
          },
          error: null,
        })
      },

      deleteNode: (nodeId: string) => {
        const { nodes } = get()
        const node = nodes[nodeId]

        if (!node || !node.parentId) {
          return set({ error: 'Cannot delete root or invalid node' })
        }

        const parent = nodes[node.parentId] as Folder
        if (!parent) {
          return set({ error: 'Parent folder not found' })
        }

        // Recursively collect all descendant IDs
        const getNodesToDelete = (id: string): string[] => {
          const currentNode = nodes[id]
          if (!currentNode) return [id]
          
          if (currentNode.type === 'folder') {
            return [id, ...currentNode.children.flatMap(getNodesToDelete)]
          }
          return [id]
        }

        const nodesToDelete = getNodesToDelete(nodeId)
        const updatedNodes = { ...nodes }
        
        // Remove all descendant nodes
        nodesToDelete.forEach(id => {
          delete updatedNodes[id]
        })

        // Update parent's children array
        const updatedParent: Folder = {
          ...parent,
          children: parent.children.filter(id => id !== nodeId),
          updatedAt: new Date(),
        }
        updatedNodes[parent.id] = updatedParent

        set({
          nodes: updatedNodes,
          selectedNodeIds: get().selectedNodeIds.filter(id => !nodesToDelete.includes(id)),
          error: null,
        })
      },

      moveNode: (nodeId: string, newParentId: string) => {
        const { nodes } = get()
        const node = nodes[nodeId]
        const newParent = nodes[newParentId]
        const oldParent = node?.parentId ? nodes[node.parentId] : null

        if (!node || !newParent || newParent.type !== 'folder' || !oldParent) {
          return set({ error: 'Invalid move operation' })
        }

        const now = new Date()
        const updatedOldParent = oldParent as Folder
        const updatedNewParent = newParent as Folder

        set({
          nodes: {
            ...nodes,
            [nodeId]: { ...node, parentId: newParentId, updatedAt: now },
            [oldParent.id]: {
              ...updatedOldParent,
              children: updatedOldParent.children.filter(id => id !== nodeId),
              updatedAt: now,
            },
            [newParentId]: {
              ...updatedNewParent,
              children: [...updatedNewParent.children, nodeId],
              updatedAt: now,
            },
          },
          error: null,
        })
      },

      // File operations
      uploadFile: (file: File, parentId?: string) => {
        const { nodes, currentFolderId } = get()
        const actualParentId = parentId || currentFolderId
        const parent = nodes[actualParentId]

        if (!parent || parent.type !== 'folder') {
          set({ error: 'Invalid parent folder' })
          return ''
        }

        const fileId = nanoid()
        const now = new Date()
        
        const newFile: File = {
          id: fileId,
          name: file.name,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          parentId: actualParentId,
          createdAt: now,
          updatedAt: now,
          // In a real app, you'd upload to storage and get a URL
          content: '', // Placeholder for mock
        }

        const updatedParent: Folder = {
          ...parent,
          children: [...parent.children, fileId],
          updatedAt: now,
        }

        set({
          nodes: {
            ...nodes,
            [fileId]: newFile,
            [actualParentId]: updatedParent,
          },
          error: null,
        })

        return fileId
      },

      // Selection
      selectNode: (nodeId: string) => {
        set({ selectedNodeIds: [nodeId] })
      },

      selectMultiple: (nodeIds: string[]) => {
        set({ selectedNodeIds: nodeIds })
      },

      clearSelection: () => {
        set({ selectedNodeIds: [] })
      },

      // Bulk operations
      deleteBulk: (nodeIds: string[]) => {
        const { nodes } = get()
        const updatedNodes = { ...nodes }
        const allNodesToDelete: string[] = []

        // Recursively collect all descendant IDs for each selected node
        const getNodesToDelete = (id: string): string[] => {
          const currentNode = nodes[id]
          if (!currentNode) return [id]
          
          if (currentNode.type === 'folder') {
            return [id, ...currentNode.children.flatMap(getNodesToDelete)]
          }
          return [id]
        }

        // Collect all nodes to delete (including descendants)
        nodeIds.forEach(nodeId => {
          const nodesToDelete = getNodesToDelete(nodeId)
          allNodesToDelete.push(...nodesToDelete)
        })

        // Remove all nodes
        allNodesToDelete.forEach(id => {
          delete updatedNodes[id]
        })

        // Update parent folders to remove deleted children
        const parentsToUpdate = new Set<string>()
        nodeIds.forEach(nodeId => {
          const node = nodes[nodeId]
          if (node?.parentId) {
            parentsToUpdate.add(node.parentId)
          }
        })

        parentsToUpdate.forEach(parentId => {
          const parent = nodes[parentId] as Folder
          if (parent) {
            updatedNodes[parentId] = {
              ...parent,
              children: parent.children.filter(id => !allNodesToDelete.includes(id)),
              updatedAt: new Date(),
            }
          }
        })

        set({
          nodes: updatedNodes,
          selectedNodeIds: [],
          error: null,
        })
      },

      // Search
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
        if (query.trim()) {
          get().searchNodes(query)
        } else {
          set({ searchResults: [] })
        }
      },

      searchNodes: (query: string) => {
        const { nodes } = get()
        const searchTerm = query.toLowerCase().trim()
        
        if (!searchTerm) {
          return set({ searchResults: [] })
        }

        const results = Object.values(nodes)
          .filter(node => 
            node.name.toLowerCase().includes(searchTerm) ||
            (node.type === 'file' && node.mimeType.toLowerCase().includes(searchTerm))
          )
          .map(node => node.id)

        set({ searchResults: results })
      },

      clearSearch: () => {
        set({ searchQuery: '', searchResults: [] })
      },

      // Utility functions
      getNodePath: (nodeId: string): Breadcrumb[] => {
        const { nodes } = get()
        const path: Breadcrumb[] = []
        let currentNode = nodes[nodeId]

        while (currentNode) {
          path.unshift({
            id: currentNode.id,
            name: currentNode.name,
            path: `/dataroom${path.length > 0 ? `/${path.map(p => p.id).join('/')}` : ''}`,
          })
          
          if (!currentNode.parentId) break
          currentNode = nodes[currentNode.parentId]
        }

        return path
      },

      getChildNodes: (folderId: string): DataroomNode[] => {
        const { nodes } = get()
        const folder = nodes[folderId] as Folder
        
        if (!folder || folder.type !== 'folder') return []
        
        return folder.children
          .map(childId => nodes[childId])
          .filter(Boolean)
          .sort((a, b) => {
            // Folders first, then files, then alphabetical
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1
            }
            return a.name.localeCompare(b.name)
          })
      },

      // Initialize with custom root folder name
      initializeWithUser: (rootFolderName?: string) => {
        set(createInitialState(rootFolderName || 'Data Room'))
      },

      reset: () => {
        set(createInitialState())
      },
    }),
    {
      name: 'dataroom-store',
    }
  )
)