import type { ShelfCategory } from "@/lib/shelf-presentation"

export type { ShelfCategory }
export type RoutineType = "cleanser" | "serum" | "moisturizer" | "spf" | "treatment" | "oil"
export type RoutinePeriod = "am" | "pm"
export type FragranceMoment = "morning" | "night" | "winter" | "summer"

export interface SharedShelfProduct {
  id: string
  product_name: string
  brand: string
  category: ShelfCategory
  routine_type?: RoutineType
  fragrance_moment?: FragranceMoment
  expiry_date: string | null
  period_after_opening: number | null
  status: "sealed" | "opened"
  opened_date: string | null
  created_at: string
  purchase_price: number
  purchase_date: string
  tag: string
  icon: string
  clean_score: number
  is_favorite?: boolean
  is_repurchase?: boolean
}

export interface RoutineSelection {
  id: string
  type: RoutineType
  productId: string
  note: string
}
