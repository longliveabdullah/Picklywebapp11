import { getAppLocale } from "@/lib/i18n"
import type { ProductRating } from "@/types"
import { mapEnvelopeToProductRating } from "@/lib/map-envelope-to-product-rating"
import type { PicklyApiEnvelope } from "@/lib/pickly-analyze/schema"

function isPicklyApiEnvelope(payload: unknown): payload is PicklyApiEnvelope {
  if (!payload || typeof payload !== "object") return false
  const candidate = payload as Record<string, unknown>
  return typeof candidate.request_id === "string" && !!candidate.result && typeof candidate.result === "object"
}

export async function analyzeProduct(imageBase64: string, _userId: string): Promise<ProductRating> {
  const response = await fetch("/api/analyze-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      imageBase64,
      mode: "in_store",
      locale: getAppLocale(),
    }),
  })

  const envelopeUnknown: unknown = await response.json()

  if (!response.ok) {
    const errorData = envelopeUnknown as { error?: string }
    throw new Error(errorData.error || "Failed to analyze product")
  }

  if (!isPicklyApiEnvelope(envelopeUnknown)) {
    throw new Error("Unexpected analysis response shape")
  }

  return mapEnvelopeToProductRating(envelopeUnknown)
}
