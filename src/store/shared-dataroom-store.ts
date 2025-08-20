import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface SharedDataroomNode {
  id: string
  name: string
  type: 'FOLDER' | 'FILE'
  parentId: string | null
  mimeType?: string
  size?: number
  createdAt: string
  updatedAt: string
}

export interface SharedDataroom {
  id: string
  name: string
  shareToken: string
  nodes: SharedDataroomNode[]
  owner: {
    name: string
    email: string
  }
  sharedFolderId?: string
}

interface SharedDataroomState {
  dataroom: SharedDataroom | null
  currentFolderId: string | null
  sharedRootId: string | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
}

interface SharedDataroomActions {
  loadSharedDataroom: (token: string) => Promise<void>
  navigateToFolder: (folderId: string | null) => void
  navigateToPath: (pathSegments: string[], sharedRootId: string | null) => void
  getCurrentFolderNodes: () => SharedDataroomNode[]
  getBreadcrumbs: () => { id: string | null; name: string }[]
  buildPathFromFolderId: (folderId: string | null, sharedRootId: string | null) => string[]
  isDescendantOfSharedRoot: (folderId: string | null, sharedRootId: string | null) => boolean
  reset: () => void
}

type SharedDataroomStore = SharedDataroomState & SharedDataroomActions

const initialState: SharedDataroomState = {
  dataroom: null,
  currentFolderId: null,
  sharedRootId: null,
  isInitialized: false,
  isLoading: false,
  error: null,
}

export const useSharedDataroomStore = create<SharedDataroomStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadSharedDataroom: async (token: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/share/${token}`)
          if (!response.ok) {
            throw new Error('Failed to fetch dataroom')
          }
          const data = await response.json()

          const sharedRootId = data.sharedFolderId || null
          
          // Add 1 second delay to show loading screen
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({
            dataroom: data.dataroom,
            sharedRootId,
            currentFolderId: sharedRootId,
            isLoading: false,
            isInitialized: true
          })
        } catch (error) {
          set({
            error: 'This share link is invalid or has expired.',
            isLoading: false,
            isInitialized: true
          })
        }
      },

      navigateToFolder: (folderId: string | null) => {
        const { dataroom } = get()
        if (!dataroom) return

        const folder = dataroom.nodes.find(n => n.id === folderId)
        if (folderId !== null && (!folder || folder.type !== 'FOLDER')) {
          return
        }

        set({ currentFolderId: folderId })
      },

      navigateToPath: (pathSegments: string[], sharedRootId: string | null) => {
        const { dataroom } = get()
        if (!dataroom) return

        let currentFolderId = sharedRootId

        if (pathSegments.length > 0) {
          const filteredSegments = pathSegments.filter(Boolean)
          let currentFolder = dataroom.nodes.find(node => node.id === sharedRootId) || null

          for (const segment of filteredSegments) {
            const decodedSegment = decodeURIComponent(segment)
            const nextFolder = dataroom.nodes.find(
              node =>
                node.parentId === currentFolder?.id &&
                node.type === 'FOLDER' &&
                node.name === decodedSegment
            )

            if (!nextFolder) {
              set({ error: 'Folder not found' })
              return
            }
            currentFolder = nextFolder
          }

          currentFolderId = currentFolder?.id || sharedRootId
        }

        set({ currentFolderId })
      },

      getCurrentFolderNodes: () => {
        const { dataroom, currentFolderId } = get()
        if (!dataroom) return []
        
        return dataroom.nodes
          .filter(node => node.parentId === currentFolderId)
          .sort((a, b) => {
            // First, sort by type (folders first)
            if (a.type !== b.type) {
              return a.type === 'FOLDER' ? -1 : 1
            }
            // Then, sort by modified date (oldest first)
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          })
      },

      getBreadcrumbs: () => {
        const { dataroom, currentFolderId, sharedRootId } = get()
        if (!dataroom) return []

        if (!sharedRootId) {
          const breadcrumbs = [{ id: null, name: dataroom.name }]
          let current = dataroom.nodes.find(n => n.id === currentFolderId)

          const path = []
          while (current) {
            path.unshift({ id: current.id, name: current.name })
            current = current.parentId
              ? dataroom.nodes.find(n => n.id === current.parentId)
              : null
          }

          return [...breadcrumbs, ...path]
        }

        const breadcrumbs = []
        let current = dataroom.nodes.find(n => n.id === currentFolderId)

        while (current && current.id !== sharedRootId) {
          breadcrumbs.unshift({ id: current.id, name: current.name })
          current = current.parentId
            ? dataroom.nodes.find(n => n.id === current.parentId)
            : null
        }

        const sharedFolder = dataroom.nodes.find(n => n.id === sharedRootId)
        breadcrumbs.unshift({
          id: sharedRootId,
          name: sharedFolder?.name || 'Shared Folder'
        })

        return breadcrumbs
      },

      buildPathFromFolderId: (folderId: string | null, sharedRootId: string | null) => {
        const { dataroom } = get()
        if (!dataroom || folderId === sharedRootId) return []

        const pathSegments: string[] = []
        let current = dataroom.nodes.find(n => n.id === folderId)

        while (current && current.id !== sharedRootId) {
          pathSegments.unshift(encodeURIComponent(current.name))
          current = current.parentId
            ? dataroom.nodes.find(n => n.id === current.parentId)
            : null
        }

        return pathSegments
      },

      isDescendantOfSharedRoot: (folderId: string | null, sharedRootId: string | null) => {
        const { dataroom } = get()
        if (!dataroom) return false

        // If no shared root (root sharing), allow access to all folders
        if (!sharedRootId) return true

        if (folderId === sharedRootId) return true
        if (folderId === null) return sharedRootId === null

        let current = dataroom.nodes.find(n => n.id === folderId)
        while (current) {
          if (current.id === sharedRootId) return true
          current = current.parentId
            ? dataroom.nodes.find(n => n.id === current.parentId)
            : null
        }
        return false
      },

      reset: () => {
        set(initialState)
      }
    }),
    { name: 'shared-dataroom-store' }
  )
)