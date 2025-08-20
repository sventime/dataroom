import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function ensureUploadDir() {
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
  await ensureUploadDir()
  
  const userDir = path.join(UPLOAD_DIR, userId, dataroomId)
  await fs.mkdir(userDir, { recursive: true })
  
  const fileExtension = path.extname(file.name)
  const fileName = `${randomUUID()}${fileExtension}`
  const filePath = path.join(userDir, fileName)
  
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  await fs.writeFile(filePath, buffer)
  
  return {
    filePath: path.relative(UPLOAD_DIR, filePath),
    fileName: file.name,
    size: buffer.length
  }
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  return fs.readFile(fullPath)
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  try {
    await fs.unlink(fullPath)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

export function getFileInfo(filePath: string) {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  return fs.stat(fullPath)
}