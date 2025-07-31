import { supabase } from "./supabase"

export interface UserScanLimits {
  id: string
  user_id: string
  email: string
  scans_today: number
  last_scan_date: string
  created_at: string
  updated_at: string
}

export class ScanLimitService {
  static async getUserScanLimits(userId: string, email: string): Promise<UserScanLimits> {
    const today = new Date().toISOString().split("T")[0] // Get YYYY-MM-DD format

    // Try to get existing scan limits
    const { data: existingLimits, error: fetchError } = await supabase
      .from("users_scan_limits")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (!existingLimits) {
      // Create new scan limits record
      const { data: newLimits, error: createError } = await supabase
        .from("users_scan_limits")
        .insert({
          user_id: userId,
          email: email,
          scans_today: 0,
          last_scan_date: today,
        })
        .select()
        .single()

      if (createError) throw createError
      return newLimits
    }

    // Check if we need to reset the daily count
    if (existingLimits.last_scan_date !== today) {
      const { data: updatedLimits, error: updateError } = await supabase
        .from("users_scan_limits")
        .update({
          scans_today: 0,
          last_scan_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single()

      if (updateError) throw updateError
      return updatedLimits
    }

    return existingLimits
  }

  static async incrementScanCount(userId: string): Promise<UserScanLimits> {
    const today = new Date().toISOString().split("T")[0]

    // Get current limits
    const currentLimits = await this.getUserScanLimits(userId, "")

    // Check if user has reached daily limit
    if (currentLimits.scans_today >= 3) {
      throw new Error("Daily scan limit reached. You can scan 3 products per day.")
    }

    // Increment scan count
    const { data: updatedLimits, error: updateError } = await supabase
      .from("users_scan_limits")
      .update({
        scans_today: currentLimits.scans_today + 1,
        last_scan_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single()

    if (updateError) throw updateError
    return updatedLimits
  }

  static async getRemainingScans(userId: string, email: string): Promise<number> {
    try {
      const limits = await this.getUserScanLimits(userId, email)
      return Math.max(0, 3 - limits.scans_today)
    } catch (error) {
      console.error("Error getting remaining scans:", error)
      return 3 // Default to full limit if there's an error
    }
  }

  static async canUserScan(userId: string, email: string): Promise<boolean> {
    try {
      const remainingScans = await this.getRemainingScans(userId, email)
      return remainingScans > 0
    } catch (error) {
      console.error("Error checking if user can scan:", error)
      return true // Default to allowing scan if there's an error
    }
  }
}
