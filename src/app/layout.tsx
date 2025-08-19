import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harvey: Test Assignment",
  description: "A test application for Harvey AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body
        className={`${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
