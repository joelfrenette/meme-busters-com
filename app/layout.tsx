import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { SimpleFooter } from "@/components/simple-footer"
import { Toaster } from "@/components/ui/toaster"
import { isAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meme-Busters.com - Fact-Check Political Memes Instantly with AI",
  description:
    "Stop the spread of misinformation! Meme-Busters uses AI to instantly fact-check political memes, verify claims, and expose propaganda. Upload any meme and get the truth in seconds. Share verified facts with friends and fight fake news on social media.",
  keywords: [
    "fact-check memes",
    "political memes",
    "meme fact checker",
    "verify memes",
    "fake news detector",
    "misinformation",
    "propaganda checker",
    "AI fact checking",
    "social media truth",
    "meme verification",
    "debunk memes",
    "political fact check",
  ],
  openGraph: {
    title: "Meme-Busters.com - Fact-Check Political Memes Instantly",
    description: "Stop the spread of misinformation! AI-powered meme fact-checking in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meme-Busters.com - Fact-Check Political Memes Instantly",
    description: "Stop the spread of misinformation! AI-powered meme fact-checking in seconds.",
  },
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await isAdminAuthenticated()

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        <DesktopHeader isAdmin={isAdmin} logoutAction={logoutAdmin} />
        <div className="pb-16 md:pb-0">{children}</div>
        <SimpleFooter />
        <MobileNav />
        <Toaster />
      </body>
    </html>
  )
}
