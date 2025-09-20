import { supabase } from "./supabase"
import type { Database } from "./database.types"
import type { UserProfile } from "@/types"
import { retryWithBackoff } from "./utils"

type UserRow = Database["public"]["Tables"]["users"]["Row"]
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"]
type ScanHistoryRow = Database["public"]["Tables"]["scan_history"]["Row"]

export class DatabaseService {
  // User operations
  static async createUser(email: string, userId: string) {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: userId,
          email,
          onboarding_complete: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async checkOnboardingStatus(userId: string) {
    return retryWithBackoff(async () => {
      const { data, error } = await supabase.from("users").select("onboarding_complete").eq("id", userId).single()

      if (error) throw error
      return data
    })
  }

  static async getUser(userId: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) throw error
    return data
  }

  static async updateUser(userId: string, updates: Partial<UserRow>) {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User profile operations
  static async createUserProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          age: profile.age || null,
          gender: profile.gender || null,
          height: profile.height || null,
          weight: profile.weight || null,
          has_diabetes: profile.hasDiabetes || false,
          allergies: profile.allergies || null,
          skin_type: profile.skinType || null,
          skin_tone: profile.skinTone || null,
          skin_concerns: profile.skinConcerns || null,
          scalp_type: profile.scalpType || null,
          hair_conditions: profile.hairConditions || null,
          goals: profile.goals || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No profile found
        return null
      }
      throw error
    }

    // Convert database format to app format
    return {
      age: data.age || undefined,
      gender: (data.gender as UserProfile["gender"]) || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      hasDiabetes: data.has_diabetes,
      allergies: data.allergies || undefined,
      skinType: (data.skin_type as UserProfile["skinType"]) || undefined,
      skinTone: (data.skin_tone as UserProfile["skinTone"]) || undefined,
      skinConcerns: data.skin_concerns || undefined,
      scalpType: (data.scalp_type as UserProfile["scalpType"]) || undefined,
      hairConditions: data.hair_conditions || undefined,
      goals: data.goals || undefined,
    }
  }

  static async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          age: profile.age || null,
          gender: profile.gender || null,
          height: profile.height || null,
          weight: profile.weight || null,
          has_diabetes: profile.hasDiabetes || false,
          allergies: profile.allergies || null,
          skin_type: profile.skinType || null,
          skin_tone: profile.skinTone || null,
          skin_concerns: profile.skinConcerns || null,
          scalp_type: profile.scalpType || null,
          hair_conditions: profile.hairConditions || null,
          goals: profile.goals || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Scan history operations
  static async saveScanToHistory(
    userId: string,
    imageUrl: string,
    productName: string | null,
    rating: number,
    explanation: string,
    recommendations: string[],
    userProfileSnapshot: UserProfile,
  ) {
    const { data, error } = await supabase
      .from("scan_history")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        product_name: productName,
        rating,
        explanation,
        recommendations,
        user_profile_snapshot: userProfileSnapshot as any,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserScanHistory(userId: string) {
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  static async deleteScanFromHistory(scanId: string, userId: string) {
    const { error } = await supabase.from("scan_history").delete().eq("id", scanId).eq("user_id", userId)

    if (error) throw error
  }
}
