import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
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

    // Find the specific dataroom and verify ownership
    const dataroom = await prisma.dataroom.findFirst({
      where: { 
        id: id,
        userId: user.id 
      },
      include: {
        nodes: {
          orderBy: [
            { type: 'asc' }, // Folders first
            { name: 'asc' }  // Then alphabetically
          ]
        }
      }
    })

    if (!dataroom) {
      return NextResponse.json({ error: 'Dataroom not found or access denied' }, { status: 404 })
    }

    // Add user information to the response
    const dataroomWithUser = {
      ...dataroom,
      user: {
        name: user.name,
        email: user.email
      }
    }

    return NextResponse.json({ dataroom: dataroomWithUser })
  } catch (error) {
    console.error('Error fetching dataroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}