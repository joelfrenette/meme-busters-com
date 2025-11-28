"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Upload, Images } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/analyze", icon: Upload, label: "Upload" },
    { href: "/gallery", icon: Images, label: "Gallery" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 header-dark border-t border-gray-700 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-[rgb(0,188,212)]" : "text-gray-300 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
