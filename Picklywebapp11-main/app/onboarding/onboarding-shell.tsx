"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { hasAcceptedOnboardingTerms } from "@/lib/onboarding-terms-storage"

const routeColors: Record<string, string> = {
  "/onboarding/terms": "#B69C85",
  "/onboarding/age": "#B69C85",
  "/onboarding/gender": "#4D5A3C",
  "/onboarding/height": "#EFE5D8",
  "/onboarding/weight": "#EFE5D8",
  "/onboarding/complete": "#F5EFE6",
}

const DEFAULT_COLOR = "#B69C85"

function OnboardingTermsGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user?.id) return
    if (pathname === "/onboarding/terms") return
    if (!hasAcceptedOnboardingTerms(user.id)) {
      router.replace("/onboarding/terms")
    }
  }, [loading, pathname, router, user?.id])

  return <>{children}</>
}

export function OnboardingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const bgColor = routeColors[pathname] ?? DEFAULT_COLOR

  return (
    <div className="fixed inset-0 overflow-y-auto">
      {/* Animated background layer */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{ backgroundColor: bgColor }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5">
        <OnboardingTermsGate>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </OnboardingTermsGate>
      </div>
    </div>
  )
}
