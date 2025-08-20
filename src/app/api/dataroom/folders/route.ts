import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { NodeType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, parentId, dataroomId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify dataroom ownership
    const dataroom = await prisma.dataroom.findFirst({
      where: { 
        id: dataroomId,
        userId: user.id 
      }
    })

    if (!dataroom) {
      return NextResponse.json({ error: 'Dataroom not found' }, { status: 404 })
    }

    // Check for duplicate names in the same parent folder
    const existingNode = await prisma.dataroomNode.findFirst({
      where: {
        dataroomId,
        parentId: parentId || null,
        name: name.trim()
      }
    })

    if (existingNode) {
      return NextResponse.json({ error: 'A file or folder with this name already exists' }, { status: 400 })
    }

    const folder = await prisma.dataroomNode.create({
      data: {
        name: name.trim(),
        type: NodeType.FOLDER,
        parentId: parentId || null,
        dataroomId
      }
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}