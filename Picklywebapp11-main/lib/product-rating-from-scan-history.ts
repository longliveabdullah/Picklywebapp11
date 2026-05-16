import { PicklyAnalyzeResultSchema } from "@/lib/pickly-analyze/schema"
import { mapEnvelopeToProductRating } from "@/lib/map-envelope-to-product-rating"
import type { ProductRating } from "@/types"

/** Maps a Supabase scan_history row into the UI ProductRating model. */
export function productRatingFromScanHistoryRow(item: {
  id: string
  rating: number
  explanation: string
  recommendations: string[]
  product_name: string | null
  analysis_json: unknown
}): ProductRating {
  const parsed = PicklyAnalyzeResultSchema.safeParse(item.analysis_json)
  if (parsed.success) {
    return mapEnvelopeToProductRating({
      request_id: item.id,
      prompt_version: "persisted",
      model_id: "persisted",
      validation_result: "ok",
      context_stats: { shelf_items_sent: 0, scans_sent: 0, past_decisions_sent: 0 },
      result: parsed.data,
    })
  }

  return {
    rating: item.rating,
    productName: item.product_name ?? "Product",
    explanation: item.explanation,
    recommendations: item.recommendations,
    healthScore: Math.min(100, Math.max(0, Math.round(item.rating * 10))),
    suitabilityScore: Math.min(100, Math.max(0, Math.round(item.rating * 10))),
    reasonsToBuy: [],
    reasonsToAvoid: [],
    summary: item.explanation,
  }
}
