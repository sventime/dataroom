import Footer from '@/components/layout/Footer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  )
}
