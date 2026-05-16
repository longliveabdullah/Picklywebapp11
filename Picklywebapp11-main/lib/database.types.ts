export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string; updated_at: string; onboarding_complete: boolean }
        Insert: { id: string; email: string; created_at?: string; updated_at?: string; onboarding_complete?: boolean }
        Update: { id?: string; email?: string; created_at?: string; updated_at?: string; onboarding_complete?: boolean }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string; user_id: string; display_name: string | null; bio: string | null; avatar_url: string | null; age: number | null; gender: string | null
          height: number | null; weight: number | null; has_diabetes: boolean
          allergies: string[] | null; skin_type: string | null; skin_tone: string | null
          skin_concerns: string[] | null; scalp_type: string | null; hair_conditions: string[] | null
          hair_type: string | null; goals: string[] | null; vegan: boolean | null
          locale: string | null; categories: string[] | null; shopping_style: string | null
          purchase_priorities: string[] | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; display_name?: string | null; bio?: string | null; avatar_url?: string | null; age?: number | null; gender?: string | null
          height?: number | null; weight?: number | null; has_diabetes?: boolean
          allergies?: string[] | null; skin_type?: string | null; skin_tone?: string | null
          skin_concerns?: string[] | null; scalp_type?: string | null; hair_conditions?: string[] | null
          hair_type?: string | null; goals?: string[] | null; vegan?: boolean | null
          locale?: string | null; categories?: string[] | null; shopping_style?: string | null
          purchase_priorities?: string[] | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string; display_name?: string | null; bio?: string | null; avatar_url?: string | null; age?: number | null; gender?: string | null
          height?: number | null; weight?: number | null; has_diabetes?: boolean
          allergies?: string[] | null; skin_type?: string | null; skin_tone?: string | null
          skin_concerns?: string[] | null; scalp_type?: string | null; hair_conditions?: string[] | null
          hair_type?: string | null; goals?: string[] | null; vegan?: boolean | null
          locale?: string | null; categories?: string[] | null; shopping_style?: string | null
          purchase_priorities?: string[] | null; created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          id: string; user_id: string; image_url: string; product_name: string | null
          rating: number; explanation: string; recommendations: string[]
          user_profile_snapshot: Json; analysis_json: Json | null
          analyze_mode: string | null; effective_mode: string | null
          product_brand: string | null; product_category: string | null; created_at: string
        }
        Insert: {
          id?: string; user_id: string; image_url: string; product_name?: string | null
          rating: number; explanation: string; recommendations: string[]
          user_profile_snapshot: Json; analysis_json?: Json | null
          analyze_mode?: string | null; effective_mode?: string | null
          product_brand?: string | null; product_category?: string | null; created_at?: string
        }
        Update: {
          id?: string; user_id?: string; image_url?: string; product_name?: string | null
          rating?: number; explanation?: string; recommendations?: string[]
          user_profile_snapshot?: Json; analysis_json?: Json | null
          analyze_mode?: string | null; effective_mode?: string | null
          product_brand?: string | null; product_category?: string | null; created_at?: string
        }
        Relationships: []
      }
      user_products: {
        Row: {
          id: string; user_id: string; product_name: string; brand: string; category: string
          expiry_date: string | null; period_after_opening: number | null; status: string
          opened_date: string | null; purchase_price: number; purchase_date: string
          routine_type: string | null; fragrance_moment: string | null
          is_favorite: boolean; is_repurchase: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; product_name: string; brand: string; category: string
          expiry_date?: string | null; period_after_opening?: number | null; status?: string
          opened_date?: string | null; purchase_price?: number; purchase_date?: string
          routine_type?: string | null; fragrance_moment?: string | null
          is_favorite?: boolean; is_repurchase?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string; product_name?: string; brand?: string; category?: string
          expiry_date?: string | null; period_after_opening?: number | null; status?: string
          opened_date?: string | null; purchase_price?: number; purchase_date?: string
          routine_type?: string | null; fragrance_moment?: string | null
          is_favorite?: boolean; is_repurchase?: boolean
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      user_scan_decisions: {
        Row: {
          id: string; user_id: string; fingerprint: string; category: string
          normalized_name: string; event_type: string; metadata: Json | null; created_at: string
        }
        Insert: {
          id?: string; user_id: string; fingerprint: string; category?: string
          normalized_name: string; event_type: string; metadata?: Json | null; created_at?: string
        }
        Update: {
          id?: string; user_id?: string; fingerprint?: string; category?: string
          normalized_name?: string; event_type?: string; metadata?: Json | null; created_at?: string
        }
        Relationships: []
      }
      users_scan_limits: {
        Row: {
          id: string; user_id: string; email: string; scans_today: number
          last_scan_date: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; email: string; scans_today?: number
          last_scan_date?: string; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string; email?: string; scans_today?: number
          last_scan_date?: string; created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      circles: {
        Row: { id: string; slug: string; name: string; description: string | null; accent: string; created_at: string }
        Insert: { id?: string; slug: string; name: string; description?: string | null; accent?: string; created_at?: string }
        Update: { id?: string; slug?: string; name?: string; description?: string | null; accent?: string }
        Relationships: []
      }
      circle_members: {
        Row: { circle_id: string; user_id: string; role: string; joined_at: string }
        Insert: { circle_id: string; user_id: string; role?: string; joined_at?: string }
        Update: { role?: string }
        Relationships: []
      }
      feed_posts: {
        Row: { id: string; user_id: string; body: string; image_path: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; body: string; image_path?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; body?: string; image_path?: string | null; updated_at?: string }
        Relationships: []
      }
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string; created_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      post_comments: {
        Row: { id: string; post_id: string; user_id: string; body: string; created_at: string }
        Insert: { id?: string; post_id: string; user_id: string; body: string; created_at?: string }
        Update: { body?: string }
        Relationships: []
      }
      product_reviews: {
        Row: {
          id: string; user_id: string; product_name: string; brand: string | null
          category: string | null; rating: number; body: string | null
          scan_id: string | null; created_at: string
        }
        Insert: {
          id?: string; user_id: string; product_name: string; brand?: string | null
          category?: string | null; rating: number; body?: string | null
          scan_id?: string | null; created_at?: string
        }
        Update: {
          product_name?: string; brand?: string | null; category?: string | null
          rating?: number; body?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: { follower_id: string; followee_id: string; created_at: string }
        Insert: { follower_id: string; followee_id: string; created_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      badges: {
        Row: { code: string; name: string; description: string; icon: string; criteria: Json }
        Insert: { code: string; name: string; description: string; icon?: string; criteria?: Json }
        Update: { name?: string; description?: string; icon?: string; criteria?: Json }
        Relationships: []
      }
      user_badges: {
        Row: { user_id: string; badge_code: string; earned_at: string }
        Insert: { user_id: string; badge_code: string; earned_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      user_future_buys: {
        Row: { id: string; user_id: string; scan_id: string | null; product_name: string | null; snapshot: Json; added_at: string }
        Insert: { id?: string; user_id: string; scan_id?: string | null; product_name?: string | null; snapshot?: Json; added_at?: string }
        Update: { product_name?: string | null; snapshot?: Json }
        Relationships: []
      }
    }
    Views: {
      v_user_follow_counts: {
        Row: { user_id: string; followers: number; following: number }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
