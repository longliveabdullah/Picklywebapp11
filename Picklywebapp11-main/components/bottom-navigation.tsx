"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/auth-context"
import {
  NavCamera,
  NavCommunity,
  NavHistory,
  NavHome,
  NavProfile,
} from "@/lib/icons"

const ACTIVE_COLOR = "#697254"
const INACTIVE_COLOR = "rgba(105,114,84,0.45)"

const navItems = [
  { labelKey: "nav.home", href: "/home", Icon: NavHome },
  { labelKey: "nav.circles", href: "/community", Icon: NavCommunity },
  { labelKey: "nav.scan", href: "/camera", isCenter: true, Icon: NavCamera },
  { labelKey: "nav.history", href: "/history", Icon: NavHistory },
  { labelKey: "nav.profile", href: "/profile", Icon: NavProfile },
] as const

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const hidden =
    !user ||
    pathname === "/" ||
    pathname === "/splash" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/signup" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/legal")

  if (hidden) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="border-t border-white/20 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-sm items-end justify-around px-2 pb-2 pt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const { Icon } = item

            if ("isCenter" in item && item.isCenter) {
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex -translate-y-3 flex-col items-center"
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full bg-[#697254] shadow-lg",
                      isActive && "ring-2 ring-[#697254]/30 ring-offset-2",
                    )}
                  >
                    <Icon size={26} color="white" strokeWidth={2} />
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
                <Icon
                  size={22}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  strokeWidth={1.8}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-[#697254]" : "text-[#697254]/45",
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}