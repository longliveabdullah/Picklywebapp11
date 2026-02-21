"use client"

import React from "react"

import { usePathname, useRouter } from "next/navigation"
import { Home, Camera, User, Crown, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  // Don't show bottom navigation on auth pages and onboarding
  if (!user || pathname === "/" || pathname === "/auth" || pathname === "/signup" || pathname.startsWith("/onboarding")) {
    return null
  }

  const handleCameraClick = () => {
    router.push("/camera")
  }

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/home",
      color: "bg-green-500",
      isActive: pathname === "/home",
    },
    {
      icon: History,
      label: "History",
      href: "/history",
      color: "bg-gray-100 border border-gray-300",
      textColor: "text-gray-600",
      isActive: pathname === "/history",
    },
    {
      icon: Crown,
      label: "Premium",
      href: "/premium",
      color: "bg-yellow-500",
      isActive: pathname === "/premium",
    },
    {
      icon: User,
      label: "Profile",
      href: "/profile",
      color: "bg-blue-500",
      isActive: pathname === "/profile",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-transparent safe-area-pb">
      <div className="flex items-end justify-center px-6 py-4">
        <div className="flex items-end justify-between w-full max-w-xs">
          {/* Home Button */}
          <button
            onClick={() => router.push(navItems[0].href)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
              navItems[0].color,
              navItems[0].isActive && "ring-4 ring-green-200",
            )}
          >
            {React.createElement(navItems[0].icon, { className: "h-6 w-6 text-white" })}
          </button>

          {/* History Button */}
          <button
            onClick={() => router.push(navItems[1].href)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
              navItems[1].color,
              navItems[1].isActive && "ring-4 ring-gray-200",
            )}
          >
            {React.createElement(navItems[1].icon, {
              className: cn("h-6 w-6", navItems[1].textColor || "text-white"),
            })}
          </button>

          {/* Camera Button - Larger and Elevated */}
          <button
            onClick={handleCameraClick}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pickly-pink to-pickly-purple shadow-lg transition-all duration-200 hover:shadow-xl transform -translate-y-2",
              pathname === "/camera" && "ring-4 ring-purple-200",
            )}
          >
            <Camera className="h-8 w-8 text-white" />
          </button>

          {/* Premium Button */}
          <button
            onClick={() => router.push(navItems[2].href)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
              navItems[2].color,
              navItems[2].isActive && "ring-4 ring-yellow-200",
            )}
          >
            {React.createElement(navItems[2].icon, { className: "h-6 w-6 text-white" })}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => router.push(navItems[3].href)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
              navItems[3].color,
              navItems[3].isActive && "ring-4 ring-blue-200",
            )}
          >
            {React.createElement(navItems[3].icon, { className: "h-6 w-6 text-white" })}
          </button>
        </div>
      </div>
    </div>
  )
}
