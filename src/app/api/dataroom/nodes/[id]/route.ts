import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/file-storage'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the node and verify ownership
    const node = await prisma.dataroomNode.findFirst({
      where: {
        id: id,
        dataroom: {
          userId: user.id
        }
      }
    })

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Check for duplicate names in the same parent folder
    const existingNode = await prisma.dataroomNode.findFirst({
      where: {
        dataroomId: node.dataroomId,
        parentId: node.parentId,
        name: name.trim(),
        id: { not: id }
      }
    })

    if (existingNode) {
      return NextResponse.json({ error: 'A file or folder with this name already exists' }, { status: 400 })
    }

    const updatedNode = await prisma.dataroomNode.update({
      where: { id: id },
      data: { name: name.trim() }
    })

    return NextResponse.json({ node: updatedNode })
  } catch (error) {
    console.error('Error updating node:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the node and verify ownership
    const node = await prisma.dataroomNode.findFirst({
      where: {
        id: id,
        dataroom: {
          userId: user.id
        }
      },
      include: {
        children: true
      }
    })

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Delete all files in the subtree first
    const nodesToDelete = await getAllDescendants(id)
    nodesToDelete.push(node)

    for (const nodeToDelete of nodesToDelete) {
      if (nodeToDelete.type === 'FILE' && nodeToDelete.filePath) {
        try {
          await deleteFile(nodeToDelete.filePath)
        } catch (error) {
          console.error(`Error deleting file ${nodeToDelete.filePath}:`, error)
        }
      }
    }

    // Delete the node (cascade will handle children)
    await prisma.dataroomNode.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting node:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getAllDescendants(nodeId: string): Promise<any[]> {
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