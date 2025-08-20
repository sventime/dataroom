import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import AuthSessionProvider from '@/components/providers/session-provider'
import { DialogProvider } from '@/contexts/DialogContext'
import { DialogRenderer } from '@/components/dialogs/DialogRenderer'

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
            <DialogProvider>
              {children}
              <DialogRenderer />
            </DialogProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
