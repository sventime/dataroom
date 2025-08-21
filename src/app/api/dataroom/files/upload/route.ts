import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/file-storage'
import { MAX_FILE_SIZE, formatFileSize } from '@/lib/constants'
import { NodeType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const parentId = formData.get('parentId') as string
    const dataroomId = formData.get('dataroomId') as string

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
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

    const uploadedFiles = []
    const conflicts = []

    for (const file of files) {
      // Check file size limit
      if (file.size > MAX_FILE_SIZE) {
        conflicts.push({ 
          name: file.name, 
          error: `File size (${formatFileSize(file.size)}) exceeds 5MB limit` 
        })
        continue
      }

      // Check for duplicate names
      const existingNode = await prisma.dataroomNode.findFirst({
        where: {
          dataroomId,
          parentId: parentId || null,
          name: file.name
        }
      })

      if (existingNode) {
        conflicts.push({ name: file.name, existing: true })
        continue
      }

      try {
        const { filePath, size } = await saveFile(file, user.id, dataroomId)

        const fileNode = await prisma.dataroomNode.create({
          data: {
            name: file.name,
            type: NodeType.FILE,
            parentId: parentId || null,
            dataroomId,
            filePath,
            mimeType: file.type || 'application/octet-stream',
            size
          }
        })
        uploadedFiles.push(fileNode)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        conflicts.push({ name: file.name, error: 'Upload failed' })
      }
    }

    return NextResponse.json({ 
      uploaded: uploadedFiles,
      conflicts 
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}