"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"
import { logger } from "@/lib/utils"
import type { User, ScanHistoryItem, UserProfile } from "@/types"
import type { AuthError } from "@supabase/supabase-js"
import { toast } from "@/hooks/use-toast"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
  addScanToHistory: (scan: Omit<ScanHistoryItem, "id" | "scannedAt">) => Promise<void>
  getScanHistory: () => Promise<ScanHistoryItem[]>
  deleteScanFromHistory: (scanId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log(`Auth: onAuthStateChange event: ${event}`)

      if (event === "INITIAL_SESSION") {
        if (session) {
          await loadUserData(session.user)
        }
        setLoading(false)
      } else if (event === "SIGNED_IN") {
        if (session) {
          await loadUserData(session.user)
          // Navigation is handled in the new useEffect hook
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // New useEffect for handling navigation after user state is updated
  useEffect(() => {
    if (!loading && user) {
      if (!user.onboardingComplete) {
        router.push("/onboarding/age")
      } else {
        router.push("/home")
      }
    }
  }, [user, loading, router])

  const loadUserData = async (authUser: any) => {
    try {
      // Check if user exists in our public.users table
      const userRecord = await DatabaseService.getUser(authUser.id).catch((err) => {
        // If user not found, error code is PGRST116. In that case, return null.
        if (err.code === "PGRST116") return null
        throw err
      })

      let finalUserRecord = userRecord
      // If user doesn't exist, create them
      if (!finalUserRecord) {
        logger.log("Auth: Creating new user in database:", authUser.email)
        finalUserRecord = await DatabaseService.createUser(authUser.email, authUser.id)
      }

      // Fetch user profile
      const profileData = await DatabaseService.getUserProfile(authUser.id)

      setUser({
        id: finalUserRecord.id,
        email: finalUserRecord.email,
        onboardingComplete: finalUserRecord.onboarding_complete,
        profile: profileData || {},
      })
    } catch (error) {
      logger.error("Auth: Error loading user data:", error)
      // Sign out the user if their data can't be loaded
      await supabase.auth.signOut()
      setUser(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Email confirmation is disabled in Supabase settings for this project
    })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error("Sign out error:", error)
      throw error
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return

    const previousUser = user
    setUser({ ...user, ...updates })

    try {
      const updatePromises: Promise<unknown>[] = []

      if (updates.onboardingComplete !== undefined) {
        updatePromises.push(
          DatabaseService.updateUser(user.id, {
            onboarding_complete: updates.onboardingComplete,
          }),
        )
      }

      if (updates.profile) {
        updatePromises.push(updateUserProfile(updates.profile))
      }

      await Promise.all(updatePromises)
    } catch (error) {
      // If the update fails, revert the user state and show a toast
      logger.error("Update user failed, reverting optimistic update:", error)
      setUser(previousUser)
      toast({
        title: "Update Failed",
        description: "Your changes could not be saved. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return
    // Errors will be caught by the calling function, `updateUser`.
    await DatabaseService.updateUserProfile(user.id, profile)
  }

  const addScanToHistory = async (scan: Omit<ScanHistoryItem, "id" | "scannedAt">) => {
    if (!user) return

    try {
      logger.log("Adding scan to history:", scan)
      await DatabaseService.saveScanToHistory(
        user.id,
        scan.imageUrl,
        scan.productName || null,
        scan.rating.rating,
        scan.rating.explanation,
        scan.rating.recommendations,
        scan.userProfile,
      )
      logger.log("Scan saved to history successfully")
    } catch (error) {
      logger.error("Add scan to history error:", error)
      throw error
    }
  }

  const getScanHistory = async (): Promise<ScanHistoryItem[]> => {
    if (!user) {
      logger.log("No user found, returning empty history")
      return []
    }

    try {
      logger.log("Fetching scan history for user:", user.id)
      const historyData = await DatabaseService.getUserScanHistory(user.id)
      logger.log("Raw history data from database:", historyData)

      const transformedHistory = historyData.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        productName: item.product_name || undefined,
        rating: {
          rating: item.rating,
          explanation: item.explanation,
          recommendations: item.recommendations,
        },
        scannedAt: new Date(item.created_at),
        userProfile: item.user_profile_snapshot as UserProfile,
      }))

      logger.log("Transformed history data:", transformedHistory)
      return transformedHistory
    } catch (error) {
      logger.error("Get scan history error:", error)
      return []
    }
  }

  const deleteScanFromHistory = async (scanId: string) => {
    if (!user) return

    try {
      logger.log("Deleting scan from history:", scanId)
      await DatabaseService.deleteScanFromHistory(scanId, user.id)
      logger.log("Scan deleted successfully")
    } catch (error) {
      logger.error("Delete scan from history error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUser,
        updateUserProfile,
        addScanToHistory,
        getScanHistory,
        deleteScanFromHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case "Invalid login credentials":
      return "Invalid email or password. Please check your credentials and try again."
    case "Email not confirmed":
      return "Please try signing in again. If the issue persists, contact support."
    case "User already registered":
      return "An account with this email already exists. Please sign in instead."
    case "Password should be at least 6 characters":
      return "Password must be at least 6 characters long."
    case "Unable to validate email address: invalid format":
      return "Please enter a valid email address."
    case "Signup is disabled":
      return "Account registration is currently disabled. Please contact support."
    case "Unsupported provider: provider is not enabled":
      return "Google sign-in is currently unavailable. Please use email and password instead."
    default:
      return error.message || "An unexpected error occurred. Please try again."
  }
}
