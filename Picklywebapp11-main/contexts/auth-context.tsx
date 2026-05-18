"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"
import { productRatingFromScanHistoryRow } from "@/lib/product-rating-from-scan-history"
import {
  clearOnboardingTermsAcceptance,
  hasAcceptedOnboardingTerms,
} from "@/lib/onboarding-terms-storage"
import { clearOnboardingProfileDraft } from "@/lib/onboarding-profile-storage"
import { logger } from "@/lib/utils"
import type { User, ScanHistoryItem, UserProfile } from "@/types"
import type { AuthError } from "@supabase/supabase-js"
import { toast } from "@/hooks/use-toast"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** When email confirmation is required in Supabase, there is no session until the user confirms — see `needsEmailConfirmation`. */
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  addScanToHistory: (scan: Omit<ScanHistoryItem, "id" | "scannedAt">) => Promise<void>
  getScanHistory: () => Promise<ScanHistoryItem[]>
  deleteScanFromHistory: (scanId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CACHED_USER_KEY = "pickly-cached-user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start null on both server and client to avoid hydration mismatch.
  // The cached user is loaded client-side in the useEffect below.
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Rehydrate from localStorage on first client render
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as User
        setUser(parsed)
        setLoading(false)
        logger.log("Auth: Rehydrated user from localStorage.")
      }
    } catch (error) {
      logger.error("Auth: Could not parse cached user.", error)
    }
  }, [])

  // This useEffect handles navigation after a user signs in or signs up.
  useEffect(() => {
    if (!loading && user) {
      const isOnAuthPage = pathname === "/" || pathname === "/auth" || pathname === "/signup"
      const isOnCallback = pathname === "/auth/callback"

      if (isOnAuthPage && !isOnCallback) {
        if (!user.onboardingComplete) {
          const termsOk = Boolean(user.id && hasAcceptedOnboardingTerms(user.id))
          router.replace(termsOk ? "/onboarding/age" : "/onboarding/terms")
        } else {
          router.replace("/home")
        }
      }
    }
  }, [user, loading, router, pathname])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log(`Auth: onAuthStateChange event: ${event}`)

      const handleUserSession = async (sessionUser: any) => {
        // Only load user data if it's different from the cached version
        if (sessionUser.id !== user?.id) {
          await loadUserData(sessionUser)
        }
      }

      switch (event) {
        case "INITIAL_SESSION":
          if (session) {
            await handleUserSession(session.user)
          } else {
            // No session, clear cache and state
            localStorage.removeItem(CACHED_USER_KEY)
            setUser(null)
          }
          setLoading(false)
          break
        case "SIGNED_IN":
          if (session) {
            await handleUserSession(session.user)
          }
          break
        case "SIGNED_OUT":
          localStorage.removeItem(CACHED_USER_KEY)
          setUser(null)
          router.push("/") // Landing page after sign out
          break
        case "USER_UPDATED":
          if (session) {
            await handleUserSession(session.user)
          }
          break
        case "TOKEN_REFRESHED":
          // The session has been refreshed, but user data likely hasn't changed.
          // We could re-fetch here if we suspect backend changes.
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, user])

  // This useEffect is removed to prevent the redirection loop during onboarding.
  // Navigation is now handled by the individual onboarding components.

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

      const newUser = {
        id: finalUserRecord.id,
        email: finalUserRecord.email,
        onboardingComplete: finalUserRecord.onboarding_complete,
        profile: profileData || {},
      }

      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(newUser))
      setUser(newUser)
    } catch (error) {
      logger.error("Auth: Error loading user data:", error)
      // Sign out the user if their data can't be loaded
      localStorage.removeItem(CACHED_USER_KEY)
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(getAuthErrorMessage(error))

    // With "Confirm email" enabled, Supabase creates the user but returns session: null — no SIGNED_IN event.
    if (data.user && !data.session) {
      return { needsEmailConfirmation: true }
    }

    // Ensure app user state updates even if onAuthStateChange is delayed (Strict Mode, listeners, etc.).
    if (data.session?.user) {
      await loadUserData(data.session.user)
    }

    return { needsEmailConfirmation: false }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
    if (error) throw new Error(getAuthErrorMessage(error))
  }

  const signOut = async () => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as User
        if (parsed?.id) clearOnboardingTermsAcceptance(parsed.id)
      }
    } catch {
      /* ignore */
    }
    localStorage.removeItem(CACHED_USER_KEY)
    clearOnboardingProfileDraft()
    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error("Sign out error:", error)
      throw error
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return

    const previousUser = { ...user }
    const newUser = {
      ...user,
      ...updates,
      profile: {
        ...user.profile,
        ...updates.profile,
      },
    }

    // Optimistically update state and localStorage
    setUser(newUser)
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(newUser))

    try {
      // Send updates to the database
      const promises = []
      if (updates.onboardingComplete !== undefined) {
        promises.push(
          DatabaseService.createUser(user.email, user.id, updates.onboardingComplete),
        )
      }
      if (updates.profile) {
        promises.push(DatabaseService.updateUserProfile(user.id, updates.profile))
      }
      await Promise.all(promises)
    } catch (error) {
      // If DB update fails, revert state and localStorage and show error
      logger.error("Update user failed, reverting optimistic update:", error)
      setUser(previousUser)
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(previousUser))
      toast({
        title: "Update Failed",
        description: "Your changes could not be saved. Please try again.",
        variant: "destructive",
      })
      // Re-throw the error so the calling component knows it failed
      throw error
    }
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
        rating: productRatingFromScanHistoryRow({
          id: item.id,
          rating: item.rating,
          explanation: item.explanation,
          recommendations: item.recommendations,
          product_name: item.product_name,
          analysis_json: item.analysis_json,
        }),
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
