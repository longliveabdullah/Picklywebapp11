"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"
import type { User, ScanHistoryItem, UserProfile } from "@/types"
import type { AuthError } from "@supabase/supabase-js"
import { toast } from "@/hooks/use-toast"
import { getQueue, addToQueue, removeFromQueue, updateQueueItem } from "@/lib/retry-queue"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
  setLocalUserProfile: (profile: Partial<UserProfile>) => void
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
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          return
        }

        if (session?.user) {
          await loadUserData(session.user.id, session.user.email!)
        }
      } catch (error) {
        console.error("Authentication error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        await loadUserData(session.user.id, session.user.email!)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- Queue Processing ---
  const processUpdateQueue = async () => {
    if (!user?.id) return

    const pendingUpdates = getQueue()
    if (pendingUpdates.length === 0) return

    console.log(`Processing ${pendingUpdates.length} pending update(s)...`)
    toast({
      title: "Syncing...",
      description: `Saving ${pendingUpdates.length} pending update(s).`,
    })

    let successCount = 0
    for (const update of pendingUpdates) {
      try {
        // Exponential backoff: wait before retrying, but not on the first attempt.
        if (update.attempts > 0) {
          // Formula: (2^attempts * 1000ms), capped at 60 seconds.
          const delay = Math.min(60000, 2 ** update.attempts * 1000)
          console.log(`Waiting ${delay}ms to retry update ${update.id}...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        // Attempt to save the data
        await DatabaseService.updateUserProfile(user.id, update.payload)

        // If successful, remove it from the queue
        removeFromQueue(update.id)
        successCount++
      } catch (error) {
        // If it fails again, increment the attempt counter and update the item.
        console.error(`Failed to process update ${update.id} (attempt ${update.attempts + 1}):`, error)
        updateQueueItem(update.id, { attempts: update.attempts + 1 })
      }
    }

    const finalQueue = getQueue()
    if (finalQueue.length === 0) {
      toast({
        title: "Sync Complete",
        description: "All your data has been saved.",
      })
      // Reload data after sync to ensure UI is consistent
      await loadUserData(user.id, user.email!)
    } else {
      toast({
        title: "Sync Incomplete",
        description: `Successfully saved ${successCount} update(s), but ${finalQueue.length} failed to save. We will try again later.`,
        variant: "destructive",
      })
    }
  }

  // Effect to process the queue when the user is loaded
  useEffect(() => {
    if (user?.id) {
      processUpdateQueue()
    }
  }, [user?.id])
  // --- End of Queue Processing ---

  const loadUserData = async (userId: string, email: string) => {
    try {
      // Get user and profile data in parallel
      const [userResult, profileData] = await Promise.all([
        DatabaseService.getUser(userId).catch(() => null), // Return null if user doesn't exist
        DatabaseService.getUserProfile(userId),
      ])

      let userData = userResult
      if (!userData) {
        // User doesn't exist in our database, create them
        console.log("Creating new user in database:", email)
        userData = await DatabaseService.createUser(email, userId)
      }

      setUser({
        id: userData.id,
        email: userData.email,
        onboardingComplete: userData.onboarding_complete,
        profile: profileData || {},
      })
    } catch (error) {
      console.error("Error loading user data:", error)
      // If we can't load user data, still set basic user info
      setUser({
        id: userId,
        email: email,
        onboardingComplete: false,
        profile: {},
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw new Error(getAuthErrorMessage(error))
      }

      if (data.user && data.session) {
        await loadUserData(data.user.id, data.user.email!)

        // Navigate based on onboarding status
        try {
          const userData = await DatabaseService.getUser(data.user.id)
          if (!userData.onboarding_complete) {
            router.push("/onboarding/age")
          } else {
            router.push("/home")
          }
        } catch {
          // If we can't get user data, assume onboarding needed
          router.push("/onboarding/age")
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Sign up without email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        throw new Error(getAuthErrorMessage(error))
      }

      if (data.user) {
        // Create user record in database
        try {
          await DatabaseService.createUser(email.trim(), data.user.id)
        } catch (dbError) {
          console.log("User might already exist in database:", dbError)
        }

        // Check if user is immediately signed in (no email confirmation required)
        if (data.session) {
          await loadUserData(data.user.id, data.user.email!)
          router.push("/onboarding/age")
        } else {
          // If no session, try to sign in immediately
          try {
            await signIn(email.trim(), password)
          } catch (signInError) {
            throw new Error("Account created successfully! Please sign in with your credentials.")
          }
        }
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Google sign in error:", error)
        throw new Error(getAuthErrorMessage(error))
      }
    } catch (error) {
      console.error("Google sign in error:", error)
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const setLocalUserProfile = (profile: Partial<UserProfile>) => {
    if (!user) return
    setUser({
      ...user,
      profile: {
        ...user.profile,
        ...profile,
      },
    })
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return

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

      // No longer reloading user data here. The optimistic update is already
      // in the local state. The queue processor will reload data if needed
      // after a successful sync.
    } catch (error) {
      // Errors are handled in the individual update functions (e.g., updateUserProfile)
      // so we just log here and don't re-throw.
      console.error("Update user error:", error)
    }
  }

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return

    try {
      await DatabaseService.updateUserProfile(user.id, profile)
    } catch (error) {
      console.error("Update user profile error (will be queued):", error)
      // Add to queue for retrying later
      addToQueue(profile)
      // Notify user
      toast({
        title: "Couldn't Save Update",
        description: "Your change will be saved when you're back online.",
        variant: "destructive",
      })
      // Do not re-throw the error, as we've handled it by queueing.
    }
  }

  const addScanToHistory = async (scan: Omit<ScanHistoryItem, "id" | "scannedAt">) => {
    if (!user) return

    try {
      console.log("Adding scan to history:", scan)
      await DatabaseService.saveScanToHistory(
        user.id,
        scan.imageUrl,
        scan.productName || null,
        scan.rating.rating,
        scan.rating.explanation,
        scan.rating.recommendations,
        scan.userProfile,
      )
      console.log("Scan saved to history successfully")
    } catch (error) {
      console.error("Add scan to history error:", error)
      throw error
    }
  }

  const getScanHistory = async (): Promise<ScanHistoryItem[]> => {
    if (!user) {
      console.log("No user found, returning empty history")
      return []
    }

    try {
      console.log("Fetching scan history for user:", user.id)
      const historyData = await DatabaseService.getUserScanHistory(user.id)
      console.log("Raw history data from database:", historyData)

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

      console.log("Transformed history data:", transformedHistory)
      return transformedHistory
    } catch (error) {
      console.error("Get scan history error:", error)
      return []
    }
  }

  const deleteScanFromHistory = async (scanId: string) => {
    if (!user) return

    try {
      console.log("Deleting scan from history:", scanId)
      await DatabaseService.deleteScanFromHistory(scanId, user.id)
      console.log("Scan deleted successfully")
    } catch (error) {
      console.error("Delete scan from history error:", error)
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
        setLocalUserProfile,
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
