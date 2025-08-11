"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DatabaseService } from "@/lib/database-service"
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
    let isMounted = true

    // Create safe state setters that check if the component is still mounted
    const safeSetUser = (user: User | null) => {
      if (isMounted) setUser(user)
    }
    const safeSetLoading = (loading: boolean) => {
      if (isMounted) setLoading(loading)
    }

    // --- 1. Initial Session Check with Timeout ---
    const initializeAuth = async () => {
      try {
        console.log("Auth: Starting initial session check...")
        const {
          data: { session },
          error,
        } = await (async () => {
          const SESSION_CHECK_TIMEOUT_MS =
            Number(process.env.NEXT_PUBLIC_SESSION_CHECK_TIMEOUT_MS) || 3000
          let timeoutId: NodeJS.Timeout | undefined
          try {
            const checkPromise = supabase.auth.getSession()
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Timeout")), SESSION_CHECK_TIMEOUT_MS)
            })
            return await Promise.race([checkPromise, timeoutPromise])
          } finally {
            clearTimeout(timeoutId)
          }
        })()

        if (error) {
          console.error("Auth: Error during initial session check.", error)
          safeSetUser(null)
          return
        }

        if (session?.user) {
          console.log("Auth: Initial session found for user:", session.user.email)
          await loadUserData(session.user.id, session.user.email!, safeSetUser)
        } else {
          console.log("Auth: No initial session found.")
          safeSetUser(null)
        }
      } catch (error) {
        console.error("Auth: Unexpected error during initial session check.", error)
        safeSetUser(null)
      } finally {
        console.log("Auth: Initial session check complete. Setting loading to false.")
        safeSetLoading(false)
      }
    }

    initializeAuth()

    // --- 2. Real-time Subscription for Auth State Changes ---
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (event === "INITIAL_SESSION") return

      console.log("Auth: onAuthStateChange event received:", event)
      if (session?.user) {
        console.log("Auth: Session updated for user:", session.user.email)
        await loadUserData(session.user.id, session.user.email!, safeSetUser)
      } else if (event === "SIGNED_OUT") {
        console.log("Auth: User signed out.")
        safeSetUser(null)
      }
    })

    // --- 3. Cleanup ---
    return () => {
      isMounted = false
      subscription?.unsubscribe?.()
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  const loadUserData = async (
    userId: string,
    email: string,
    setter: (user: User | null) => void = setUser,
  ) => {
    try {
      const [userResult, profileData] = await Promise.all([
        DatabaseService.getUser(userId).catch(() => null),
        DatabaseService.getUserProfile(userId),
      ])

      let userData = userResult
      if (!userData) {
        console.log("Creating new user in database:", email)
        userData = await DatabaseService.createUser(email, userId)
      }

      setter({
        id: userData.id,
        email: userData.email,
        onboardingComplete: userData.onboarding_complete,
        profile: profileData || {},
      })
    } catch (error) {
      console.error("Error loading user data:", error)
      setter({
        id: userId,
        email: email,
        onboardingComplete: false,
        profile: {},
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    console.log("SignIn: Attempting to sign in...")
    let signInTimeoutId: NodeJS.Timeout | undefined
    let getUserTimeoutId: NodeJS.Timeout | undefined

    try {
      // --- Step 1: Authenticate with Supabase ---
      const { data, error } = await (async () => {
        const SIGNIN_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_SIGNIN_TIMEOUT_MS) || 5000
        try {
          const signInPromise = supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
          const signInTimeoutPromise = new Promise((_, reject) => {
            signInTimeoutId = setTimeout(() => reject(new Error("SignIn Timeout")), SIGNIN_TIMEOUT_MS)
          })
          return await Promise.race([signInPromise, signInTimeoutPromise])
        } finally {
          clearTimeout(signInTimeoutId)
        }
      })()

      console.log("SignIn: Received response from Supabase.", { hasData: !!data, hasError: !!error })
      if (error || !data?.session || !data?.user) {
        console.error("SignIn: Supabase auth error or missing session/user.", error)
        throw new Error(getAuthErrorMessage(error || new Error("Missing session data.")))
      }

      // --- Step 2: Determine Navigation Path ---
      const { user } = data
      console.log("SignIn: Auth successful for user:", user.email)
      try {
        const userData = await (async () => {
          const GET_USER_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_GET_USER_TIMEOUT_MS) || 2000
          try {
            const getUserPromise = DatabaseService.getUser(user.id)
            const getUserTimeoutPromise = new Promise((_, reject) => {
              getUserTimeoutId = setTimeout(() => reject(new Error("GetUser Timeout")), GET_USER_TIMEOUT_MS)
            })
            return await Promise.race([getUserPromise, getUserTimeoutPromise])
          } finally {
            clearTimeout(getUserTimeoutId)
          }
        })()

        if (userData && !userData.onboarding_complete) {
          router.push("/onboarding/age")
        } else {
          router.push("/home")
        }
      } catch (e) {
        console.error("SignIn: Failed to get user for onboarding check (or timed out). Defaulting to onboarding.", e)
        router.push("/onboarding/age")
      }

      // --- Step 3: Finalize UI and Background Sync ---
      setLoading(false)
      console.log("SignIn: Navigation triggered, loading spinner stopped.")
      loadUserData(user.id, user.email!).catch((err) => {
        console.error("SignIn: Background loadUserData failed.", err)
      })
    } catch (error) {
      console.error("SignIn: An unexpected error occurred during the sign-in process.", error)
      if (loading) setLoading(false)
      throw error
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
      console.error("Update user failed, reverting optimistic update:", error)
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
