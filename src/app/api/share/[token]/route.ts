import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const navigationPath = searchParams.get('path') || ''
  
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        dataroom: {
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
        },
        sharedFolder: true
      }
    })

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    const { dataroom, sharedFolderId } = shareLink
    let currentFolderId = sharedFolderId

    if (navigationPath) {
      const pathSegments = navigationPath.split('/').filter(Boolean)
      let currentFolder = shareLink.sharedFolder
      
      for (const segment of pathSegments) {
        const decodedSegment = decodeURIComponent(segment)
        const nextFolder = dataroom.nodes.find(
          node => node.parentId === currentFolder?.id && 
                  node.type === 'FOLDER' && 
                  node.name === decodedSegment
        )
        
        if (!nextFolder) {
          return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
        }
        currentFolder = nextFolder
      }
      
      currentFolderId = currentFolder?.id || sharedFolderId
    }

    const accessibleNodes = dataroom.nodes.filter(node => {
      if (!sharedFolderId) return true
      
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