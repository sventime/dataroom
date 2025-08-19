import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from '@/components/layout/Footer'
import AuthSessionProvider from '@/components/providers/SessionProvider'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body className={`${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
