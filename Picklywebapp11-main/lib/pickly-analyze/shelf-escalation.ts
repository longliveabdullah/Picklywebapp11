/** Map UI product hints to shelf category keys stored in SharedShelfProduct.category */

const HINT_TO_SHELF_KEYS: Record<string, string[]> = {
  skincare: ["skin"],
  makeup: ["makeup"],
  haircare: ["hair"],
  fragrance: ["fragrance"],
}

function norm(s: string) {
  return s.trim().toLowerCase()
}

/**
 * Conservative pre-flight escalation: user has shelf items in the same macro category as the scan hint.
 * Reduces wasted Pickly Now calls when shelf overlap context is materially likely.
 */
export function shouldPrefetchResearchForShelf(
  productTypeHint: string | null | undefined,
  shelf_compact: Array<{ category: string }> | undefined,
): boolean {
  if (!productTypeHint || !shelf_compact?.length) return false
  const keys = HINT_TO_SHELF_KEYS[norm(productTypeHint)] ?? []
  if (!keys.length) return false

  return shelf_compact.some((row) => keys.includes(norm(row.category)))
}
