'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LoaderContextType {
  isLoading: boolean
  animatingOut: boolean
  message?: string
  showLoader: () => void
  hideLoader: (withAnimation?: boolean) => void
  setMessage: (message: string) => void
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)
  const [message, setMessage] = useState<string>()

  const showLoader = () => {
    setIsLoading(true)
    setAnimatingOut(false)
  }

  const hideLoader = (withAnimation = true) => {
    // Don't do anything if loader is already hidden or currently animating out
    if (!isLoading || animatingOut) return
    
    if (withAnimation) {
      setAnimatingOut(true)
      setTimeout(() => {
        setIsLoading(false)
        setAnimatingOut(false)
      }, 300)
    } else {
      setIsLoading(false)
      setAnimatingOut(false)
    }
  }

  return (
    <LoaderContext.Provider
      value={{
        isLoading,
        animatingOut,
        message,
        showLoader,
        hideLoader,
        setMessage
      }}
    >
      {children}
    </LoaderContext.Provider>
  )
}

export function useLoader() {
  const context = useContext(LoaderContext)
  if (context === undefined) {
    throw new Error('useLoader must be used within a LoaderProvider')
  }
  return context
}