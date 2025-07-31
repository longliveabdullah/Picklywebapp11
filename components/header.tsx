"use client"

import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

export function Header() {
  const pathname = usePathname()

  // Don't show header on auth pages
  if (pathname === "/" || pathname === "/signup") {
    return null
  }

  return (
    <header className="py-4">
      <div className="container flex justify-center items-center">
        <Logo />
      </div>
    </header>
  )
}
