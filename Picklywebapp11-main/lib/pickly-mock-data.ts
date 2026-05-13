"use client"

export type ShelfCategory = "skin" | "makeup" | "hair" | "body" | "fragrance"
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

export const categoryMeta: Record<ShelfCategory, { accent: string; label: string }> = {
  skin: { accent: "#A7AD89", label: "Skincare" },
  makeup: { accent: "#B69C85", label: "Makeup" },
  hair: { accent: "#8C916C", label: "Haircare" },
  body: { accent: "#DBD0C4", label: "Body" },
  fragrance: { accent: "#92735C", label: "Fragrance" },
}

export const routineTypeMeta: Record<RoutineType, { label: string; icon: string }> = {
  cleanser: { label: "Cleanser", icon: "Bubbles" },
  serum: { label: "Serum", icon: "Glow" },
  moisturizer: { label: "Moisturizer", icon: "Barrier" },
  spf: { label: "SPF", icon: "Shield" },
  treatment: { label: "Treatment", icon: "Active" },
  oil: { label: "Oil", icon: "Finish" },
}

export const fragranceMomentMeta: Record<FragranceMoment, { label: string }> = {
  morning: { label: "Morning" },
  night: { label: "Night" },
  winter: { label: "Winter" },
  summer: { label: "Summer" },
}

export const shelfProducts: SharedShelfProduct[] = [
  {
    id: "1",
    product_name: "Gentle Gel Cleanser",
    brand: "CeraVe",
    category: "skin",
    routine_type: "cleanser",
    expiry_date: "2026-12-01",
    period_after_opening: 12,
    status: "opened",
    opened_date: "2026-04-20",
    created_at: "2026-04-18",
    purchase_price: 14.99,
    purchase_date: "2026-05-03",
    tag: "BARRIER-SAFE",
    icon: "🫧",
    clean_score: 88,
    is_favorite: true,
  },
  {
    id: "2",
    product_name: "Vitamin C Serum",
    brand: "The Ordinary",
    category: "skin",
    routine_type: "serum",
    expiry_date: "2026-11-15",
    period_after_opening: 6,
    status: "opened",
    opened_date: "2026-04-01",
    created_at: "2026-03-20",
    purchase_price: 28.49,
    purchase_date: "2026-05-09",
    tag: "CLEAN BEAUTY",
    icon: "✨",
    clean_score: 92,
    is_favorite: true,
    is_repurchase: true,
  },
  {
    id: "3",
    product_name: "Ceramide Moisturizer",
    brand: "Dr. Jart+",
    category: "skin",
    routine_type: "moisturizer",
    expiry_date: "2026-10-30",
    period_after_opening: 9,
    status: "opened",
    opened_date: "2026-04-15",
    created_at: "2026-04-10",
    purchase_price: 32.0,
    purchase_date: "2026-05-02",
    tag: "DERMA-TESTED",
    icon: "🧴",
    clean_score: 90,
    is_favorite: true,
  },
  {
    id: "4",
    product_name: "SPF 50 Sunscreen",
    brand: "La Roche-Posay",
    category: "skin",
    routine_type: "spf",
    expiry_date: "2027-03-01",
    period_after_opening: 12,
    status: "sealed",
    opened_date: null,
    created_at: "2026-04-10",
    purchase_price: 22.0,
    purchase_date: "2026-05-07",
    tag: "REEF-SAFE",
    icon: "☀️",
    clean_score: 91,
    is_repurchase: true,
  },
  {
    id: "5",
    product_name: "Retinol Night Cream",
    brand: "Paula's Choice",
    category: "skin",
    routine_type: "treatment",
    expiry_date: "2026-09-25",
    period_after_opening: 6,
    status: "opened",
    opened_date: "2026-03-10",
    created_at: "2026-03-05",
    purchase_price: 34.95,
    purchase_date: "2026-04-26",
    tag: "NIGHT REPAIR",
    icon: "🌙",
    clean_score: 87,
    is_favorite: true,
  },
  {
    id: "6",
    product_name: "Argan Oil Mask",
    brand: "Moroccanoil",
    category: "hair",
    routine_type: "oil",
    expiry_date: "2026-06-10",
    period_after_opening: 12,
    status: "opened",
    opened_date: "2026-01-15",
    created_at: "2026-01-10",
    purchase_price: 16.5,
    purchase_date: "2026-05-04",
    tag: "CRUELTY-FREE",
    icon: "💆",
    clean_score: 83,
  },
  {
    id: "7",
    product_name: "Matte Lipstick",
    brand: "MAC",
    category: "makeup",
    expiry_date: "2027-03-01",
    period_after_opening: 18,
    status: "sealed",
    opened_date: null,
    created_at: "2026-04-10",
    purchase_price: 18.75,
    purchase_date: "2026-04-18",
    tag: "ICONIC SHADE",
    icon: "💄",
    clean_score: 75,
  },
  {
    id: "8",
    product_name: "Chance Eau Tendre",
    brand: "Chanel",
    category: "fragrance",
    fragrance_moment: "morning",
    expiry_date: null,
    period_after_opening: 24,
    status: "opened",
    opened_date: "2026-03-28",
    created_at: "2026-03-20",
    purchase_price: 96,
    purchase_date: "2026-05-01",
    tag: "SOFT FLORAL",
    icon: "🌸",
    clean_score: 82,
    is_favorite: true,
  },
  {
    id: "9",
    product_name: "Black Opium",
    brand: "YSL",
    category: "fragrance",
    fragrance_moment: "night",
    expiry_date: null,
    period_after_opening: 24,
    status: "opened",
    opened_date: "2026-02-14",
    created_at: "2026-02-10",
    purchase_price: 112,
    purchase_date: "2026-04-22",
    tag: "NIGHT SCENT",
    icon: "🌙",
    clean_score: 78,
    is_favorite: true,
  },
  {
    id: "10",
    product_name: "Libre Intense",
    brand: "YSL",
    category: "fragrance",
    fragrance_moment: "winter",
    expiry_date: null,
    period_after_opening: 24,
    status: "sealed",
    opened_date: null,
    created_at: "2026-04-08",
    purchase_price: 118,
    purchase_date: "2026-04-17",
    tag: "WINTER MOOD",
    icon: "❄️",
    clean_score: 80,
  },
  {
    id: "11",
    product_name: "Light Blue",
    brand: "Dolce & Gabbana",
    category: "fragrance",
    fragrance_moment: "summer",
    expiry_date: null,
    period_after_opening: 24,
    status: "opened",
    opened_date: "2026-04-27",
    created_at: "2026-04-24",
    purchase_price: 89,
    purchase_date: "2026-05-05",
    tag: "SUMMER FRESH",
    icon: "☀️",
    clean_score: 81,
  },
]

export const defaultRoutine: Record<RoutinePeriod, RoutineSelection[]> = {
  am: [
    { id: "am-1", type: "cleanser", productId: "1", note: "Keeps the barrier calm and balanced." },
    { id: "am-2", type: "serum", productId: "2", note: "Adds glow and antioxidant support." },
    { id: "am-3", type: "moisturizer", productId: "3", note: "Locks in hydration with ceramides." },
    { id: "am-4", type: "spf", productId: "4", note: "Daily protection is non-negotiable." },
  ],
  pm: [
    { id: "pm-1", type: "cleanser", productId: "1", note: "Removes buildup without stripping." },
    { id: "pm-2", type: "treatment", productId: "5", note: "Retinol nights for texture and tone." },
    { id: "pm-3", type: "moisturizer", productId: "3", note: "Barrier-first finish." },
    { id: "pm-4", type: "oil", productId: "6", note: "Softens ends and seals in moisture." },
  ],
}

export function cloneDefaultRoutine() {
  return {
    am: defaultRoutine.am.map((step) => ({ ...step })),
    pm: defaultRoutine.pm.map((step) => ({ ...step })),
  }
}

export const featuredShelfIds = {
  holyGrails: ["2", "3", "4"],
  repurchased: ["2", "4"],
  favorites: ["1", "2", "3", "5"],
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
  const filtered = products.filter((product) => product.routine_type === type)
  return filtered.length > 0 ? filtered : products.filter((product) => product.category === "skin" || product.category === "hair")
}

export function deriveWalletData(products: SharedShelfProduct[]) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const previousMonth = previousMonthDate.getMonth()
  const previousYear = previousMonthDate.getFullYear()

  const currentMonthItems = products.filter((product) => {
    const date = new Date(product.purchase_date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const previousMonthItems = products.filter((product) => {
    const date = new Date(product.purchase_date)
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear
  })

  const monthlySpend = currentMonthItems.reduce((total, product) => total + product.purchase_price, 0)
  const previousMonthlySpend = previousMonthItems.reduce((total, product) => total + product.purchase_price, 0)
  const lastMonthDiff = previousMonthlySpend > 0 ? ((monthlySpend - previousMonthlySpend) / previousMonthlySpend) * 100 : 0

  const categoryTotals = currentMonthItems.reduce<Record<ShelfCategory, number>>(
    (acc, product) => {
      acc[product.category] += product.purchase_price
      return acc
    },
    { skin: 0, makeup: 0, hair: 0, body: 0, fragrance: 0 },
  )

  const visibleCategories = (Object.entries(categoryTotals) as [ShelfCategory, number][])
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])

  const breakdownData = visibleCategories.map(([category, total]) => ({
    label: categoryMeta[category].label,
    pct: monthlySpend > 0 ? Math.round((total / monthlySpend) * 100) : 0,
    color: categoryMeta[category].accent,
  }))

  const cleanScore = Math.round(products.reduce((sum, product) => sum + product.clean_score, 0) / products.length)
  const savedAmount = Number((products.filter((product) => product.clean_score >= 88).length * 8.5).toFixed(1))

  const recentPurchases = [...products]
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .map((product) => ({
      id: product.id,
      name: product.product_name,
      price: product.purchase_price,
      tag: product.tag,
      tagColor: categoryMeta[product.category].accent,
      tagBg: categoryMeta[product.category].accent,
      date: formatPurchaseDate(product.purchase_date),
      icon: product.icon,
    }))

  return {
    monthlySpend,
    lastMonthDiff,
    cleanScore,
    savedAmount,
    breakdownData,
    recentPurchases,
  }
}
