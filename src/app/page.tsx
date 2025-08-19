import Button from '@/components/Button'
import FileUpload from '@/components/FileUpload'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="continer max-w-250 mx-auto p-20">
      <div className="bg-gray-800 p-10">
        <h1 className="text-4xl">Typography</h1>
        <p className="text-lg mt-4">
          This is a test application for <strong>Harvey AI</strong>. It uses the Harvey AI
          font stack and demonstrates various typography styles.
        </p>
      </div>

      <div className="mt-10">
        <FileUpload />
      </div>
    </div>
  )
}
