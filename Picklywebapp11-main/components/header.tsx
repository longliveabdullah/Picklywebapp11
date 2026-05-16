"use client"

import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  // Don't show header on auth pages
  if (pathname === "/" || pathname === "/signup") {
    return null
  }

  return (
    <header className="py-4">
      <div className="container flex justify-center items-center">
        <Logo />
        {process.env.NODE_ENV === "development" && (
          <Button
            onClick={() => void signOut()}
            data-testid="signout-button"
            variant="outline"
            className="ml-4"
          >
            TEST SIGN OUT
          </Button>
        )}
      </div>
    </header>
  )
}
