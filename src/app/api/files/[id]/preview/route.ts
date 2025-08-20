import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getFileBuffer } from '@/lib/file-storage'

async function isDescendantOfFolder(fileId: string, sharedFolderId: string): Promise<boolean> {
  const file = await prisma.dataroomNode.findUnique({
    where: { id: fileId },
    include: { dataroom: { include: { nodes: true } } }
  })
  
  if (!file) return false
  
  let current = file
  while (current.parentId) {
    if (current.parentId === sharedFolderId) return true
    current = file.dataroom.nodes.find(n => n.id === current.parentId) || current
    if (!current || current.parentId === current.id) break
  }
  return false
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('token')
    
    let hasAccess = false
    let fileNode = null

    if (shareToken) {
      // Public access via share token
      const shareLink = await prisma.shareLink.findUnique({
        where: { token: shareToken },
        include: {
          dataroom: {
            include: {
              nodes: {
                where: { id: id }
              }
            }
          }
        }
      })
      
      if (shareLink && shareLink.dataroom.nodes.length > 0) {
        fileNode = shareLink.dataroom.nodes[0]
        
        // Verify file is accessible within shared folder scope
        if (shareLink.sharedFolderId) {
          hasAccess = fileNode.parentId === shareLink.sharedFolderId || 
            await isDescendantOfFolder(fileNode.id, shareLink.sharedFolderId)
        } else {
          hasAccess = true
        }
      }
    } else {
      // Authenticated access
      const session = await getServerSession()
      
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      fileNode = await prisma.dataroomNode.findFirst({
        where: {
          id: id,
          type: 'FILE',
          dataroom: {
            userId: user.id
          }
        }
      })

      if (fileNode) {
        hasAccess = true
      }
    }

    if (!hasAccess || !fileNode || fileNode.type !== 'FILE') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (!fileNode.filePath) {
      return NextResponse.json({ error: 'File path not found' }, { status: 404 })
    }

    const buffer = await getFileBuffer(fileNode.filePath)
    
    const headers = new Headers()
    headers.set('Content-Type', fileNode.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `inline; filename="${fileNode.name}"`)
    headers.set('Content-Length', buffer.length.toString())
    
    // Add cache headers for better performance
    headers.set('Cache-Control', 'public, max-age=3600')
    
    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Error serving file preview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}