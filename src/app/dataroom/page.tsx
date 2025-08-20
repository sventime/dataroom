'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDataroomStore } from '@/store/dataroom-store'
import { HarveyLoader } from '@/components/ui/harvey-loader'

export default function DataroomRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { loadDataroom, dataroom, isLoading } = useDataroomStore()

  useEffect(() => {
    if (status === 'authenticated') {
      const redirectToDataroom = async () => {
        await loadDataroom()
        // Redirect to the new URL structure once dataroom is loaded
      }
      redirectToDataroom()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, loadDataroom])

  useEffect(() => {
    if (dataroom) {
      // Redirect to the new dataroom structure
      router.replace(`/dataroom/${dataroom.id}`)
    }
  }, [dataroom, router])

  if (status === 'loading' || isLoading) {
    return <HarveyLoader message="Loading your dataroom..." />
  }

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