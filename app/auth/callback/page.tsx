"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// This component is rendered when the user is redirected back from the OAuth provider.
export default function AuthCallback() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // The onAuthStateChange listener in AuthProvider will handle the session.
    // We just need to wait for the user state to be updated.
    // The navigation logic is now centralized in AuthProvider.
    // If there's an error, the user will be null, and they will be redirected to the sign-in page by the ProtectedRoute or AuthProvider.
    if (!loading && !user) {
      // If loading is finished and there's still no user, it's likely an auth error.
      // Redirect to sign-in with an error message.
      router.push("/?error=callback_error")
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
