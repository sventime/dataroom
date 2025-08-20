import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getFileBuffer } from '@/lib/file-storage'

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
      const dataroom = await prisma.dataroom.findUnique({
        where: { shareToken },
        include: {
          nodes: {
            where: { id: id }
          }
        }
      })
      
      if (dataroom && dataroom.nodes.length > 0) {
        fileNode = dataroom.nodes[0]
        hasAccess = true
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
    headers.set('Content-Type', 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${fileNode.name}"`)
    headers.set('Content-Length', buffer.length.toString())
    
    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Error serving file download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}