import { PicklyAnalyzeBodySchema, type PicklyAnalyzeBody } from "@/lib/pickly-analyze/schema"

export function stripJsonFence(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

export function tryParseAnalyzeBody(raw: string): PicklyAnalyzeBody | null {
  try {
    const parsed = JSON.parse(stripJsonFence(raw))
    const r = PicklyAnalyzeBodySchema.safeParse(parsed)
    return r.success ? r.data : null
  } catch {
    return null
  }
}
