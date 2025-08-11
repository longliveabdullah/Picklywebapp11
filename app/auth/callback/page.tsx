"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const CALLBACK_TIMEOUT_MS = 8000 // 8 seconds

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
            console.log("User not found in DB, creating new user entry.")
            await DatabaseService.createUser(user.email!, user.id)
          }

          // Check onboarding status
          const userData = await DatabaseService.getUser(user.id)
          if (!userData.onboarding_complete) {
            router.push("/onboarding/age")
          } else {
            router.push("/home")
          }
        } else {
          // No session found after callback, redirect to home
          router.push("/")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/?error=callback_error")
      }
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), CALLBACK_TIMEOUT_MS),
    )

    Promise.race([handleAuthCallback(), timeoutPromise]).catch((error) => {
      if (error.message === "Timeout") {
        console.warn(`Auth callback timed out after ${CALLBACK_TIMEOUT_MS}ms.`)
        router.push("/?error=callback_timeout")
      }
      // Other errors are handled and redirected inside handleAuthCallback
    })
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
