"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AuthCallback() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return

    if (!loading && user) {
      setHasRedirected(true)

      // Direct navigation based on onboarding status
      if (!user.onboardingComplete) {
        router.replace("/onboarding/age")
      } else {
        router.replace("/home")
      }
    } else if (!loading && !user) {
      // Auth failed, redirect to login with error
      setHasRedirected(true)
      router.replace("/?error=auth_failed")
    }
  }, [user, loading, router, hasRedirected])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-purple-100 opacity-20 mx-auto"></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Completing sign in...</p>
          <p className="text-sm text-gray-500">Please wait while we set up your account</p>
        </div>
      </div>
    </div>
  )
}
