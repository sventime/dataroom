export interface BaseNode {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  parentId: string | null
}

export interface Folder extends BaseNode {
  type: 'folder'
  children: string[] // Array of child node IDs
}

export interface File extends BaseNode {
  type: 'file'
  size: number
  mimeType: string
  content?: string // For mock storage
  url?: string // For actual file URLs
}

export type DataroomNode = Folder | File

export interface Breadcrumb {
  id: string
  name: string
  path: string
}

export interface DataroomState {
  // Core data
  nodes: Record<string, DataroomNode>
  rootFolderId: string
  
  // Navigation
  currentFolderId: string
  breadcrumbs: Breadcrumb[]
  
  // UI state
  selectedNodeIds: string[]
  isLoading: boolean
  error: string | null
  
  // Search
  searchQuery: string
  searchResults: string[]
}

export interface DataroomActions {
  // Navigation
  navigateToFolder: (folderId: string) => void
  goBack: () => void
  
  // Folder operations
  createFolder: (name: string, parentId?: string) => string
  renameNode: (nodeId: string, newName: string) => void
  deleteNode: (nodeId: string) => void
  moveNode: (nodeId: string, newParentId: string) => void
  
  // File operations
  uploadFile: (file: File, parentId?: string) => string
  
  // Selection
  selectNode: (nodeId: string) => void
  selectMultiple: (nodeIds: string[]) => void
  clearSelection: () => void
  
  // Search
  setSearchQuery: (query: string) => void
  searchNodes: (query: string) => void
  clearSearch: () => void
  
  // Utility
  getNodePath: (nodeId: string) => Breadcrumb[]
  getChildNodes: (folderId: string) => DataroomNode[]
  reset: () => void
}

export type DataroomStore = DataroomState & DataroomActions