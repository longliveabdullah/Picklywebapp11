/**
 * Re-export shim — all real logic lives in:
 *   lib/shelf-types.ts      (types)
 *   lib/shelf-presentation.ts (categoryMeta, shelfPresentationByCategory, routineTypeMeta, fragranceMomentMeta)
 *   lib/shelf-utils.ts      (pure helpers: getProductStatus, formatDate, cloneDefaultRoutine, …)
 *   lib/wallet-derivation.ts (deriveWalletData)
 *
 * Keep this file so existing imports from "@/lib/pickly-mock-data" still resolve.
 * Migrate callers to the new paths over time.
 */

export type { ShelfCategory, RoutineType, RoutinePeriod, FragranceMoment, SharedShelfProduct, RoutineSelection } from "@/lib/shelf-types"

export { categoryMeta, shelfPresentationByCategory } from "@/lib/shelf-presentation"

export const routineTypeMeta: Record<
  import("@/lib/shelf-types").RoutineType,
  { label: string; icon: string }
> = {
  cleanser: { label: "Cleanser", icon: "Bubbles" },
  serum: { label: "Serum", icon: "Glow" },
  moisturizer: { label: "Moisturizer", icon: "Barrier" },
  spf: { label: "SPF", icon: "Shield" },
  treatment: { label: "Treatment", icon: "Active" },
  oil: { label: "Oil", icon: "Finish" },
}

export const fragranceMomentMeta: Record<
  import("@/lib/shelf-types").FragranceMoment,
  { label: string }
> = {
  morning: { label: "Morning" },
  night: { label: "Night" },
  winter: { label: "Winter" },
  summer: { label: "Summer" },
}

export { defaultRoutine, cloneDefaultRoutine, getProductStatus, formatDate, formatPurchaseDate, getRoutineProductOptions } from "@/lib/shelf-utils"

export { deriveWalletData } from "@/lib/wallet-derivation"
