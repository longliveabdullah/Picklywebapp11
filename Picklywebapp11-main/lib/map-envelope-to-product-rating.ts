import type { PicklyApiEnvelope } from "@/lib/pickly-analyze/schema"
import type { ProductRating } from "@/types"

export function mapEnvelopeToProductRating(envelope: PicklyApiEnvelope): ProductRating {
  const r = envelope.result

  const reasonsToBuy = r.ingredient_highlights.map((item) => `${item.name}: ${item.relevance}`)
  const reasonsToAvoid = r.flagged_ingredients.map((item) => `${item.name}: ${item.reason}`)

  return {
    rating: r.score,
    productName: r.productName,
    explanation: r.recommended_action || r.personalized_why[0] || "",
    recommendations: r.personalized_why.length ? r.personalized_why : [r.recommended_action].filter(Boolean),
    healthScore: Math.round(Math.min(100, Math.max(0, r.score * 10))),
    suitabilityScore: Math.round(Math.min(100, Math.max(0, r.score * 10))),
    reasonsToBuy,
    reasonsToAvoid,
    summary: r.personalized_why.slice(0, 3).join(" · ") || r.recommended_action,
    picklyEnvelope: envelope,
  }
}
