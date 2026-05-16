"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { hasAcceptedOnboardingTerms } from "@/lib/onboarding-terms-storage"

export default function ProtectedRoute({
  children,
  requireOnboarding = false,
}: {
  children: React.ReactNode
  requireOnboarding?: boolean
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth")
      } else if (requireOnboarding && !user.onboardingComplete) {
        const termsOk = Boolean(user.id && hasAcceptedOnboardingTerms(user.id))
        router.push(termsOk ? "/onboarding/age" : "/onboarding/terms")
      }
    }
  }, [user, loading, router, requireOnboarding])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
