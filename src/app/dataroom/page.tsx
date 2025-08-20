'use client'

import { useLoader } from '@/contexts/loader-context'
import { useDataroomStore } from '@/store/dataroom-store'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DataroomRedirectPage() {
  const { status } = useSession()
  const router = useRouter()
  const { loadDataroom, dataroom } = useDataroomStore()
  const { showLoader, setMessage } = useLoader()

  useEffect(() => {
    if (status === 'authenticated') {
      setMessage('Loading your dataroom...')
      showLoader()
      loadDataroom()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, loadDataroom, router, showLoader, setMessage])

  useEffect(() => {
    if (dataroom) {
      router.replace(`/dataroom/${dataroom.id}`)
    }
  }, [dataroom, router])

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access your dataroom.</p>
        </div>
      </div>
    )
  }

  return null
}
