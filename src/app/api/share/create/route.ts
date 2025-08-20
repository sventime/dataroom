import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dataroomId, folderId } = await request.json()

  try {
    const dataroom = await prisma.dataroom.findFirst({
      where: {
        id: dataroomId,
        user: { email: session.user.email }
      }
    })

    if (!dataroom) {
      return NextResponse.json({ error: 'Dataroom not found' }, { status: 404 })
    }

    if (folderId) {
      const folder = await prisma.dataroomNode.findFirst({
        where: {
          id: folderId,
          dataroomId: dataroomId,
          type: 'FOLDER'
        }
      })

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        dataroomId,
        sharedFolderId: folderId || null
      }
    })

    return NextResponse.json({ 
      shareUrl: `${new URL(request.url).origin}/share/${shareLink.token}` 
    })
  } catch (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}