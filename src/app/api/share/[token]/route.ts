import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const sharedPath = searchParams.get('path')
  
  try {
    const dataroom = await prisma.dataroom.findUnique({
      where: { shareToken: token },
      include: {
        nodes: {
          orderBy: [
            { type: 'asc' },
            { name: 'asc' }
          ]
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!dataroom) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    let sharedFolderId: string | null = null
    let currentFolderId: string | null = null

    if (sharedPath) {
      const pathSegments = sharedPath.split('/').filter(Boolean)
      let currentFolder: any = null
      
      for (let i = 0; i < pathSegments.length; i++) {
        const decodedSegment = decodeURIComponent(pathSegments[i])
        const parentId = i === 0 ? null : currentFolder?.id
        
        const nextFolder = dataroom.nodes.find(
          node => node.parentId === parentId && 
                  node.type === 'FOLDER' && 
                  node.name === decodedSegment
        )
        
        if (!nextFolder) {
          return NextResponse.json({ error: 'Shared folder not found' }, { status: 404 })
        }
        currentFolder = nextFolder
      }
      
      sharedFolderId = currentFolder?.id || null
      currentFolderId = sharedFolderId
    } else {
      sharedFolderId = null
      currentFolderId = null
    }

    const accessibleNodes = dataroom.nodes.filter(node => {
      if (sharedFolderId === null) return node.parentId === null
      
      if (node.id === sharedFolderId) return true
      
      let current = node
      while (current.parentId) {
        if (current.parentId === sharedFolderId) return true
        current = dataroom.nodes.find(n => n.id === current.parentId)!
        if (!current) break
      }
      return false
    })

    return NextResponse.json({ 
      dataroom: {
        id: dataroom.id,
        name: dataroom.name,
        shareToken: dataroom.shareToken,
        nodes: accessibleNodes,
        owner: dataroom.user
      },
      sharedFolderId,
      currentFolderId
    })
  } catch (error) {
    console.error('Error fetching shared dataroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}