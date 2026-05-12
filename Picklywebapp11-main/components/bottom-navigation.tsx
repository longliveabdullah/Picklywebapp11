"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

const ACTIVE_COLOR = "#697254"
const INACTIVE_COLOR = "rgba(105,114,84,0.45)"

const navItems = [
  {
    label: "Home",
    href: "/home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? ACTIVE_COLOR : "none"} stroke={active ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9" stroke={active ? "white" : INACTIVE_COLOR} fill="none"/>
      </svg>
    ),
  },
  {
    label: "Skin Helper",
    href: "/products",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3C12 3 9 3 9 6v3h6V6c0-3-3-3-3-3z"/>
        <rect x="8" y="9" width="8" height="12" rx="2"/>
        <path d="M8 13h8"/>
      </svg>
    ),
  },
  {
    label: "Scan",
    href: "/camera",
    isCenter: true,
    icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    label: "History",
    href: "/history",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: "Community",
    href: "/profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const hidden =
    !user ||
    pathname === "/" ||
    pathname === "/splash" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/signup" ||
    pathname.startsWith("/onboarding")

  if (hidden) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="border-t border-white/20 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-sm items-end justify-around px-2 pb-2 pt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            if ("isCenter" in item && item.isCenter) {
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex -translate-y-3 flex-col items-center"
                >
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full bg-[#697254] shadow-lg",
                    isActive && "ring-2 ring-[#697254]/30 ring-offset-2"
                  )}>
                    {item.icon(true)}
                  </div>
                </button>
              )
            }

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex min-w-[56px] flex-col items-center gap-0.5 py-1.5"
              >
                {item.icon(isActive)}
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-[#697254]" : "text-[#697254]/45"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
