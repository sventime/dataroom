import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const dataroom = await prisma.dataroom.findUnique({
      where: { shareToken: token },
      include: {
        nodes: {
          orderBy: [
            { type: 'asc' }, // Folders first
            { name: 'asc' }  // Then alphabetically
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

    return NextResponse.json({ 
      dataroom: {
        id: dataroom.id,
        name: dataroom.name,
        shareToken: dataroom.shareToken,
        nodes: dataroom.nodes,
        owner: dataroom.user
      }
    })
  } catch (error) {
    console.error('Error fetching shared dataroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}