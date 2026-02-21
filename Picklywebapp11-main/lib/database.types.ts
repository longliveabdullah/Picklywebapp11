export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          onboarding_complete: boolean
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          onboarding_complete?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          onboarding_complete?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          age: number | null
          gender: string | null
          height: number | null
          weight: number | null
          has_diabetes: boolean
          allergies: string[] | null
          skin_type: string | null
          scalp_type: string | null
          goals: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          has_diabetes?: boolean
          allergies?: string[] | null
          skin_type?: string | null
          scalp_type?: string | null
          goals?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          has_diabetes?: boolean
          allergies?: string[] | null
          skin_type?: string | null
          scalp_type?: string | null
          goals?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      scan_history: {
        Row: {
          id: string
          user_id: string
          image_url: string
          product_name: string | null
          rating: number
          explanation: string
          recommendations: string[]
          user_profile_snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          product_name?: string | null
          rating: number
          explanation: string
          recommendations: string[]
          user_profile_snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          product_name?: string | null
          rating?: number
          explanation?: string
          recommendations?: string[]
          user_profile_snapshot?: Json
          created_at?: string
        }
      }
      users_scan_limits: {
        Row: {
          id: string
          user_id: string
          email: string
          scans_today: number
          last_scan_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          scans_today?: number
          last_scan_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          scans_today?: number
          last_scan_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
