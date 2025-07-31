"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/?error=auth_error")
          return
        }

        if (data.session?.user) {
          const user = data.session.user

          // Ensure user exists in our database
          try {
            await DatabaseService.getUser(user.id)
          } catch {
            // User doesn't exist, create them
            await DatabaseService.createUser(user.email!, user.id)
          }

          // Check onboarding status
          try {
            const userData = await DatabaseService.getUser(user.id)
            if (!userData.onboarding_complete) {
              router.push("/onboarding/age")
            } else {
              router.push("/home")
            }
          } catch {
            // If we can't get user data, assume onboarding needed
            router.push("/onboarding/age")
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/?error=callback_error")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
