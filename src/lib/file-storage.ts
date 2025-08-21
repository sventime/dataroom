import { put, del, head } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// Fallback to local storage for development
const isVercel = !!process.env.VERCEL
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function ensureUploadDir() {
  if (isVercel) return // No need for directories in Vercel Blob
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function saveFile(
  file: File,
  userId: string,
  dataroomId: string
): Promise<{ filePath: string; fileName: string; size: number }> {
  const arrayBuffer = await file.arrayBuffer()
  
  if (isVercel) {
    // Use Vercel Blob for production
    const fileExtension = path.extname(file.name)
    const fileName = `${randomUUID()}${fileExtension}`
    const filePath = `${userId}/${dataroomId}/${fileName}`
    
    const blob = await put(filePath, arrayBuffer, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    })
    
    return {
      filePath: blob.url, // Store the full URL for Vercel Blob
      fileName: file.name,
      size: arrayBuffer.byteLength
    }
  } else {
    // Use local file system for development
    await ensureUploadDir()
    
    const userDir = path.join(UPLOAD_DIR, userId, dataroomId)
    await fs.mkdir(userDir, { recursive: true })
    
    const fileExtension = path.extname(file.name)
    const fileName = `${randomUUID()}${fileExtension}`
    const filePath = path.join(userDir, fileName)
    
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, buffer)
    
    return {
      filePath: path.relative(UPLOAD_DIR, filePath),
      fileName: file.name,
      size: buffer.length
    }
  }
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  if (isVercel) {
    // For Vercel Blob, filePath is actually the full URL
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } else {
    // Local file system
    const fullPath = path.join(UPLOAD_DIR, filePath)
    return fs.readFile(fullPath)
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  if (isVercel) {
    // For Vercel Blob, extract the pathname from the URL
    try {
      const url = new URL(filePath)
      const pathname = url.pathname.substring(1) // Remove leading slash
      await del(pathname)
    } catch (error) {
      console.error('Error deleting file from Vercel Blob:', error)
    }
  } else {
    // Local file system
    const fullPath = path.join(UPLOAD_DIR, filePath)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }
}

export async function getFileInfo(filePath: string) {
  if (isVercel) {
    // For Vercel Blob
    try {
      const url = new URL(filePath)
      const pathname = url.pathname.substring(1)
      return await head(pathname)
    } catch (error) {
      console.error('Error getting file info from Vercel Blob:', error)
      throw error
    }
  } else {
    // Local file system
    const fullPath = path.join(UPLOAD_DIR, filePath)
    return fs.stat(fullPath)
  }
}