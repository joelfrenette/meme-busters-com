"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

interface DesktopHeaderProps {
  isAdmin: boolean
  logoutAction: () => Promise<void>
}

export function DesktopHeader({ isAdmin, logoutAction }: DesktopHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="header-dark border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="https://meme-busters.com" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="logo-text">Meme-Busters</span>
              <span className="text-gray-300">.com</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="https://meme-busters.com" className="text-sm text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/analyze" className="text-sm text-gray-300 hover:text-white transition-colors">
              Analyze Meme
            </Link>
            <Link href="/gallery" prefetch={true} className="text-sm text-gray-300 hover:text-white transition-colors">
              Gallery
            </Link>

            {isAdmin ? (
              <>
                <Link href="/admin" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/settings" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  AI Settings
                </Link>
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="text-sm px-4 py-1.5 border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-colors bg-transparent"
                  >
                    LOGOUT
                  </Button>
                </form>
              </>
            ) : (
              <Link
                href="/admin/login"
                className="text-sm px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors font-medium"
              >
                LOGIN
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col gap-4">
              <Link
                href="https://meme-busters.com"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/analyze"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analyze Meme
              </Link>
              <Link
                href="/gallery"
                prefetch={true}
                className="text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </Link>

              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    AI Settings
                  </Link>
                  <form action={logoutAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full text-sm px-4 py-1.5 border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-colors bg-transparent"
                    >
                      LOGOUT
                    </Button>
                  </form>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-sm px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  LOGIN
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
