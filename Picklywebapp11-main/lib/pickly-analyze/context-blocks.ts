import type { AnalyzeProductRequest } from "@/lib/pickly-analyze/schema"

export type DbProfileShape = {
  skin_type: string | null
  skin_tone: string | null
  skin_concerns: string[] | null
  scalp_type: string | null
  hair_conditions: string[] | null
  hair_type: string | null
  goals: string[] | null
  allergies: string[] | null
  has_diabetes: boolean
  vegan: boolean | null
  categories: string[] | null
  shopping_style: string | null
  purchase_priorities: string[] | null
  locale: string | null
}

export function formatProfileBlock(profile: DbProfileShape | null): string {
  if (!profile) {
    return `PROFILE SNAPSHOT:\n(No saved profile row yet — personalize gently and invite onboarding completion.)`
  }

  const lines = [
    `Skin type: ${profile.skin_type ?? "unknown"}`,
    `Skin tone: ${profile.skin_tone ?? "unknown"}`,
    `Skin concerns: ${profile.skin_concerns?.join(", ") || "none listed"}`,
    `Scalp type: ${profile.scalp_type ?? "unknown"}`,
    `Hair type: ${profile.hair_type ?? "unknown"}`,
    `Hair conditions: ${profile.hair_conditions?.join(", ") || "none listed"}`,
    `Goals: ${profile.goals?.join(", ") || "none listed"}`,
    `Allergies: ${profile.allergies?.join(", ") || "none listed"}`,
    `Diabetes: ${profile.has_diabetes ? "yes" : "no"}`,
    `Vegan preference: ${profile.vegan === null ? "unknown" : profile.vegan ? "yes" : "no"}`,
    `Shopping style: ${profile.shopping_style ?? "unknown"}`,
    `Purchase priorities: ${profile.purchase_priorities?.join(", ") || "none listed"}`,
    `Interested categories: ${profile.categories?.join(", ") || "none listed"}`,
  ]

  return `PROFILE SNAPSHOT:\n${lines.join("\n")}`
}

export function formatShelfBlock(body: AnalyzeProductRequest): string {
  const shelf = body.client_context?.shelf_compact ?? []
  if (!shelf.length) return `RELEVANT SHELF (max 8):\n(empty — user has not synced shelf yet)`

  const lines = shelf.slice(0, 8).map((item, idx) => {
    const brand = item.brand ? `${item.brand} · ` : ""
    return `${idx + 1}. ${brand}${item.product_name} — category: ${item.category}`
  })

  return `RELEVANT SHELF (max ${Math.min(shelf.length, 8)}):\n${lines.join("\n")}`
}

export function formatRoutineBlock(body: AnalyzeProductRequest): string {
  const rc = body.client_context?.routine_compact
  if (!rc?.am && !rc?.pm) return `ROUTINE COMPACT:\n(not provided)`

  return `ROUTINE COMPACT:\nAM: ${rc.am}\nPM: ${rc.pm}`
}

export function formatFutureBuysBlock(body: AnalyzeProductRequest): string {
  const fb = body.client_context?.future_buys ?? []
  if (!fb.length) return `FUTURE BUY LIST:\n(empty)`

  const lines = fb.slice(0, 8).map((item, idx) => `${idx + 1}. ${item.product_name}${item.category ? ` (${item.category})` : ""}`)
  return `FUTURE BUY LIST:\n${lines.join("\n")}`
}

export function formatRecentScansBlock(rows: Array<{ product_name: string | null; rating: number; explanation: string; created_at: string }>): string {
  if (!rows.length) return `RECENT SCANS:\n(none)`

  const lines = rows.map((row, idx) => {
    const name = row.product_name || "Unknown product"
    return `${idx + 1}. ${name} — score ${row.rating}/10 (${new Date(row.created_at).toISOString().slice(0, 10)})`
  })
  return `RECENT SCANS:\n${lines.join("\n")}`
}

export function formatPastDecisionsBlock(
  rows: Array<{ category: string; normalized_name: string; event_type: string; created_at: string }>,
): string {
  if (!rows.length) return `PAST DECISIONS:\n(none)`

  const lines = rows.map((row, idx) => {
    return `${idx + 1}. ${row.event_type} — ${row.normalized_name} (${row.category}) @ ${new Date(row.created_at).toISOString().slice(0, 10)}`
  })
  return `PAST DECISIONS:\n${lines.join("\n")}`
}
