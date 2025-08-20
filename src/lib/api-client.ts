export interface ApiDataroomNode {
  id: string
  name: string
  type: 'FOLDER' | 'FILE'
  parentId: string | null
  dataroomId: string
  filePath?: string
  mimeType?: string
  size?: number
  createdAt: string
  updatedAt: string
}

export interface ApiDataroom {
  id: string
  name: string
  shareToken: string
  nodes: ApiDataroomNode[]
  user?: {
    name: string | null
    email: string | null
  }
}

export class DataroomApiClient {
  static async getDataroom(): Promise<ApiDataroom> {
    const response = await fetch('/api/dataroom')
    if (!response.ok) {
      throw new Error('Failed to fetch dataroom')
    }
    const data = await response.json()
    return data.dataroom
  }

  static async getDataroomById(dataroomId: string): Promise<ApiDataroom> {
    const response = await fetch(`/api/dataroom/${dataroomId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch dataroom')
    }
    const data = await response.json()
    return data.dataroom
  }

  static async createFolder(name: string, parentId: string | null, dataroomId: string): Promise<ApiDataroomNode> {
    const response = await fetch('/api/dataroom/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parentId, dataroomId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create folder')
    }

    const data = await response.json()
    return data.folder
  }

  static async uploadFiles(files: File[], parentId: string | null, dataroomId: string): Promise<{
    uploaded: ApiDataroomNode[]
    conflicts: Array<{ name: string; error?: string; existing?: boolean }>
  }> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    if (parentId) formData.append('parentId', parentId)
    formData.append('dataroomId', dataroomId)

    const response = await fetch('/api/dataroom/files/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload files')
    }

    return response.json()
  }

  static async renameNode(nodeId: string, name: string): Promise<ApiDataroomNode> {
    const response = await fetch(`/api/dataroom/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to rename node')
    }

    const data = await response.json()
    return data.node
  }

  static async deleteNode(nodeId: string): Promise<void> {
    const response = await fetch(`/api/dataroom/nodes/${nodeId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete node')
    }
  }

  static async bulkDelete(nodeIds: string[]): Promise<void> {
    const response = await fetch('/api/dataroom/nodes/bulk-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodeIds })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete nodes')
    }
  }
}