import { DialogRenderer } from '@/components/dialogs/DialogRenderer'
import AuthSessionProvider from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Toaster } from '@/components/ui/sonner'
import { DialogProvider } from '@/contexts/DialogContext'
import { LoaderProvider } from '@/contexts/loader-context'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Harvey: Data Room',
  description: 'A test application for Harvey AI, By Daniel Semirazov',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LoaderProvider>
              <DialogProvider>
                {children}
                <DialogRenderer />
                <Toaster />
                <GlobalLoader />
              </DialogProvider>
            </LoaderProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
