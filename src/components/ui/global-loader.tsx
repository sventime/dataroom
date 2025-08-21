'use client'

import { useLoader } from '@/contexts/loader-context'
import { HarveyLoader } from './harvey-loader'

export function GlobalLoader() {
  const { isLoading, animatingOut, message } = useLoader()

  if (!isLoading && !animatingOut) return null

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex items-center justify-center ${
        animatingOut
          ? 'animate-out fade-out-0 zoom-out-95 duration-300'
          : 'animate-in fade-in-0 zoom-in-98'
      }`}
    >
      <HarveyLoader message={message} />
    </div>
  )
}