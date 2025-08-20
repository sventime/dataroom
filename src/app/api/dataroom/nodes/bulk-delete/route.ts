import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/file-storage'
import { DataroomNode } from '@prisma/client'

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { nodeIds } = await request.json()

    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return NextResponse.json({ error: 'Node IDs are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find all nodes and verify ownership
    const nodes = await prisma.dataroomNode.findMany({
      where: {
        id: { in: nodeIds },
        dataroom: {
          userId: user.id
        }
      }
    })

    if (nodes.length !== nodeIds.length) {
      return NextResponse.json({ error: 'Some nodes not found or access denied' }, { status: 404 })
    }

    // Get all descendants for each node
    const allNodesToDelete = []
    for (const nodeId of nodeIds) {
      const descendants = await getAllDescendants(nodeId)
      const rootNode = nodes.find(n => n.id === nodeId)
      if (rootNode) {
        allNodesToDelete.push(rootNode, ...descendants)
      }
    }

    // Delete all files first
    for (const node of allNodesToDelete) {
      if (node.type === 'FILE' && node.filePath) {
        try {
          await deleteFile(node.filePath)
        } catch (error) {
          console.error(`Error deleting file ${node.filePath}:`, error)
        }
      }
    }

    // Delete all nodes
    await prisma.dataroomNode.deleteMany({
      where: {
        id: { in: nodeIds }
      }
    })

    return NextResponse.json({ success: true, deletedCount: nodes.length })
  } catch (error) {
    console.error('Error bulk deleting nodes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getAllDescendants(nodeId: string): Promise<DataroomNode[]> {
  const children = await prisma.dataroomNode.findMany({
    where: { parentId: nodeId }
  })

  const descendants = [...children]
  
  for (const child of children) {
    const childDescendants = await getAllDescendants(child.id)
    descendants.push(...childDescendants)
  }

  return descendants
}