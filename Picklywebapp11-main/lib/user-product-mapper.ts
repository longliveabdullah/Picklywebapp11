import type { Database } from "@/lib/database.types"
import { shelfPresentationByCategory, type ShelfCategory } from "@/lib/shelf-presentation"
import type { FragranceMoment, RoutineType, SharedShelfProduct } from "@/lib/pickly-mock-data"

export type UserProductRow = Database["public"]["Tables"]["user_products"]["Row"]

function parseCategory(raw: string): ShelfCategory {
  if (raw === "skin" || raw === "makeup" || raw === "hair" || raw === "body" || raw === "fragrance") {
    return raw
  }
  return "skin"
}

function parseRoutine(raw: string | null | undefined): RoutineType | undefined {
  if (!raw) return undefined
  const allowed: RoutineType[] = ["cleanser", "serum", "moisturizer", "spf", "treatment", "oil"]
  return allowed.includes(raw as RoutineType) ? (raw as RoutineType) : undefined
}

function parseFragranceMoment(raw: string | null | undefined): FragranceMoment | undefined {
  if (!raw) return undefined
  const allowed: FragranceMoment[] = ["morning", "night", "winter", "summer"]
  return allowed.includes(raw as FragranceMoment) ? (raw as FragranceMoment) : undefined
}

function toIsoDate(d: string | null | undefined): string | null {
  if (!d) return null
  return d.slice(0, 10)
}

export function userProductRowToShared(row: UserProductRow): SharedShelfProduct {
  const category = parseCategory(row.category)
  const pres = shelfPresentationByCategory[category]

  const purchaseDate = toIsoDate(row.purchase_date) ?? new Date().toISOString().slice(0, 10)
  const createdAt = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : purchaseDate
  const purchasePrice = row.purchase_price != null ? Number(row.purchase_price) : 0

  return {
    id: row.id,
    product_name: row.product_name,
    brand: row.brand,
    category,
    routine_type: parseRoutine(row.routine_type),
    fragrance_moment: parseFragranceMoment(row.fragrance_moment),
    expiry_date: toIsoDate(row.expiry_date),
    period_after_opening: row.period_after_opening,
    status: row.status === "opened" ? "opened" : "sealed",
    opened_date: toIsoDate(row.opened_date),
    created_at: createdAt,
    purchase_price: purchasePrice,
    purchase_date: purchaseDate,
    tag: pres.tag,
    icon: pres.icon,
    clean_score: pres.clean_score,
  }
}

export type NewShelfProductFields = {
  product_name: string
  brand: string
  category: ShelfCategory
  expiry_date: string | null
  period_after_opening: number | null
  status: "sealed" | "opened"
  purchase_price: number
  purchase_date: string
  routine_type?: RoutineType
  fragrance_moment?: FragranceMoment
}

export function newShelfProductToInsert(userId: string, input: NewShelfProductFields): Database["public"]["Tables"]["user_products"]["Insert"] {
  const purchaseDay = input.purchase_date.slice(0, 10)
  return {
    user_id: userId,
    product_name: input.product_name.trim(),
    brand: input.brand.trim(),
    category: input.category,
    expiry_date: input.expiry_date || null,
    period_after_opening: input.period_after_opening,
    status: input.status,
    opened_date: input.status === "opened" ? purchaseDay : null,
    purchase_price: input.purchase_price,
    purchase_date: purchaseDay,
    routine_type: input.routine_type ?? null,
    fragrance_moment: input.fragrance_moment ?? null,
  }
}
