"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"
import { logger } from "@/lib/utils"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const handleAuthCallback = async () => {
      const CALLBACK_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_CALLBACK_TIMEOUT_MS) || 8000
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      try {
        const callbackPromise = (async () => {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw new Error("Auth callback error: " + error.message)
          if (!data.session?.user) throw new Error("No session found after callback.")

          const { user } = data.session
          try {
            await DatabaseService.getUser(user.id)
          } catch {
            logger.log("User not found in DB, creating new user entry.")
            await DatabaseService.createUser(user.email!, user.id)
          }

          const userData = await DatabaseService.getUser(user.id)
          if (isMounted) {
            if (!userData.onboarding_complete) {
              router.push("/onboarding/age")
            } else {
              router.push("/home")
            }
          }
        })()

        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout")), CALLBACK_TIMEOUT_MS)
        })

        await Promise.race([callbackPromise, timeoutPromise])
      } catch (error) {
        console.error("Auth callback failed:", error)
        if (isMounted) {
          const queryParam = error.message === "Timeout" ? "callback_timeout" : "callback_error"
          router.push(`/?error=${queryParam}`)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    handleAuthCallback()

    return () => {
      isMounted = false
    }
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
