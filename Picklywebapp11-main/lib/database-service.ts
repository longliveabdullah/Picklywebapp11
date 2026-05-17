import { supabase } from "./supabase"
import type { Database } from "./database.types"
import type { UserProfile } from "@/types"
import { retryWithBackoff } from "./utils"
import {
  newShelfProductToInsert,
  userProductRowToShared,
  type NewShelfProductFields,
  type UserProductRow,
} from "./user-product-mapper"

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
          has_diabetes: profile.hasDiabetes || false,
          allergies: profile.allergies || null,
          skin_type: profile.skinType || null,
          skin_tone: profile.skinTone || null,
          skin_concerns: profile.skinConcerns || null,
          scalp_type: profile.scalpType || null,
          hair_conditions: profile.hairConditions || null,
          hair_type: profile.hairType || null,
          goals: profile.goals || null,
          vegan: profile.vegan ?? null,
          categories: profile.categories || null,
          shopping_style: profile.shoppingStyle || null,
          purchase_priorities: profile.purchasePriorities || null,
          locale: profile.locale || null,
          display_name: profile.displayName?.trim() || null,
          bio: profile.bio?.trim() || null,
          avatar_url: profile.avatarUrl?.trim() || null,
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
      displayName: data.display_name?.trim() || undefined,
      bio: data.bio?.trim() || undefined,
      avatarUrl: data.avatar_url?.trim() || undefined,
      hasDiabetes: data.has_diabetes,
      allergies: data.allergies || undefined,
      skinType: (data.skin_type as UserProfile["skinType"]) || undefined,
      skinTone: (data.skin_tone as UserProfile["skinTone"]) || undefined,
      skinConcerns: data.skin_concerns || undefined,
      scalpType: (data.scalp_type as UserProfile["scalpType"]) || undefined,
      hairConditions: data.hair_conditions || undefined,
      hairType: data.hair_type || undefined,
      goals: data.goals || undefined,
      vegan: data.vegan ?? undefined,
      categories: data.categories || undefined,
      shoppingStyle: data.shopping_style || undefined,
      purchasePriorities: data.purchase_priorities || undefined,
      locale: data.locale === "tr" || data.locale === "en" ? data.locale : undefined,
    }
  }

  static async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          has_diabetes: profile.hasDiabetes || false,
          allergies: profile.allergies || null,
          skin_type: profile.skinType || null,
          skin_tone: profile.skinTone || null,
          skin_concerns: profile.skinConcerns || null,
          scalp_type: profile.scalpType || null,
          hair_conditions: profile.hairConditions || null,
          hair_type: profile.hairType || null,
          goals: profile.goals || null,
          vegan: profile.vegan ?? null,
          categories: profile.categories || null,
          shopping_style: profile.shoppingStyle || null,
          purchase_priorities: profile.purchasePriorities || null,
          locale: profile.locale || null,
          ...(profile.displayName !== undefined
            ? { display_name: profile.displayName.trim() || null }
            : {}),
          ...(profile.bio !== undefined ? { bio: profile.bio.trim() || null } : {}),
          ...(profile.avatarUrl !== undefined ? { avatar_url: profile.avatarUrl.trim() || null } : {}),
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

  static async updateDisplayName(userId: string, displayName: string) {
    const trimmed = displayName.trim().slice(0, 50)
    if (!trimmed) throw new Error("Display name cannot be empty")

    const { data: existing } = await supabase.from("user_profiles").select("user_id").eq("user_id", userId).maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ display_name: trimmed, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select("display_name")
        .single()
      if (error) throw error
      return data.display_name
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({ user_id: userId, display_name: trimmed, updated_at: new Date().toISOString() })
      .select("display_name")
      .single()
    if (error) throw error
    return data.display_name
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

  /** Personal shelf (SSOT for prices); wallet UI derives from these rows. */
  static async getUserProducts(userId: string): Promise<UserProductRow[]> {
    const { data, error } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as UserProductRow[]
  }

  static async insertUserProduct(userId: string, input: NewShelfProductFields) {
    const { data, error } = await supabase
      .from("user_products")
      .insert(newShelfProductToInsert(userId, input))
      .select()
      .single()

    if (error) throw error
    return data as UserProductRow
  }

  static async deleteUserProduct(userId: string, productId: string) {
    const { error } = await supabase.from("user_products").delete().eq("id", productId).eq("user_id", userId)

    if (error) throw error
  }
}
