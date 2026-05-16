import type { SharedShelfProduct, RoutineType, RoutinePeriod, RoutineSelection } from "@/lib/shelf-types"

export const defaultRoutine: Record<RoutinePeriod, RoutineSelection[]> = { am: [], pm: [] }

export function cloneDefaultRoutine() {
  return {
    am: defaultRoutine.am.map((step) => ({ ...step })),
    pm: defaultRoutine.pm.map((step) => ({ ...step })),
  }
}

export function getProductStatus(product: SharedShelfProduct) {
  if (!product.expiry_date) return { label: "Fresh", color: "#A7AD89", bg: "bg-[#A7AD89]/15" }
  const days = Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: "Expired", color: "#C45B4A", bg: "bg-red-50" }
  if (days <= 30) return { label: "Expires Soon", color: "#B69C85", bg: "bg-[#B69C85]/15" }
  return { label: "Fresh", color: "#A7AD89", bg: "bg-[#A7AD89]/15" }
}

export function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatPurchaseDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function getRoutineProductOptions(products: SharedShelfProduct[], type: RoutineType) {
  const filtered = products.filter((p) => p.routine_type === type)
  return filtered.length > 0
    ? filtered
    : products.filter((p) => p.category === "skin" || p.category === "hair")
}
