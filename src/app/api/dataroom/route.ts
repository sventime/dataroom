import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        datarooms: {
          include: {
            nodes: {
              orderBy: [
                { type: 'asc' }, // Folders first
                { name: 'asc' }  // Then alphabetically
              ]
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create default dataroom if none exists
    let dataroom = user.datarooms[0]
    if (!dataroom) {
      dataroom = await prisma.dataroom.create({
        data: {
          userId: user.id,
          name: 'Data Room'
        },
        include: {
          nodes: true
        }
      })
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