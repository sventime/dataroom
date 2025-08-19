import Image from 'next/image'
import { GalleryVerticalEnd } from 'lucide-react'
import { LoginForm } from '@/components/form/login-form'

export default function Home() {
  return <LoginPage />
}

function LoginPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-6 p-6 md:p-10 flex-1">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="#"
          className="flex items-center gap-2 self-center font-medium font-serif text-4xl mb-4"
        >
          Harvey: Data Room
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
