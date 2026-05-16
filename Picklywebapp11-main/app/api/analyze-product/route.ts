import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CONTEXT_CAPS, PICKLY_PROMPT_VERSION, picklyModelId } from "@/lib/pickly-analyze/constants"
import {
  formatFutureBuysBlock,
  formatPastDecisionsBlock,
  formatProfileBlock,
  formatRecentScansBlock,
  formatRoutineBlock,
  formatShelfBlock,
  type DbProfileShape,
} from "@/lib/pickly-analyze/context-blocks"
import { fallbackAnalyzeBody } from "@/lib/pickly-analyze/fallback-body"
import { createOpenRouterClient, parseBodyFromContent, runRepairJson, runVisionAnalyze } from "@/lib/pickly-analyze/run-model"
import { shouldPrefetchResearchForShelf } from "@/lib/pickly-analyze/shelf-escalation"
import {
  AnalyzeProductRequestSchema,
  PicklyApiEnvelopeSchema,
  attachAnalyzeMode,
  type AnalyzeRequestMode,
} from "@/lib/pickly-analyze/schema"
import { applyAllergenOverrideBody, findTriggeredAllergens } from "@/lib/pickly-analyze/safety"
import { trimToPicklyNow } from "@/lib/pickly-analyze/trim-result"
import { resolveDisplayName } from "@/lib/display-name-resolve"
import type { Database, Json } from "@/lib/database.types"

export const maxDuration = 60

type ScanHistoryInsert = Database["public"]["Tables"]["scan_history"]["Insert"]

function coerceDbProfile(row: Record<string, unknown> | null): DbProfileShape | null {
  if (!row) return null

  const arr = (value: unknown): string[] | null =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : null

  return {
    age: typeof row.age === "number" ? row.age : null,
    gender: typeof row.gender === "string" ? row.gender : null,
    skin_type: typeof row.skin_type === "string" ? row.skin_type : null,
    skin_tone: typeof row.skin_tone === "string" ? row.skin_tone : null,
    skin_concerns: arr(row.skin_concerns),
    scalp_type: typeof row.scalp_type === "string" ? row.scalp_type : null,
    hair_conditions: arr(row.hair_conditions),
    hair_type: typeof row.hair_type === "string" ? row.hair_type : null,
    goals: arr(row.goals),
    allergies: arr(row.allergies),
    has_diabetes: Boolean(row.has_diabetes),
    vegan: typeof row.vegan === "boolean" ? row.vegan : null,
    categories: arr(row.categories),
    shopping_style: typeof row.shopping_style === "string" ? row.shopping_style : null,
    purchase_priorities: arr(row.purchase_priorities),
    locale: typeof row.locale === "string" ? row.locale : null,
  }
}

export async function POST(request: NextRequest) {
  const request_id = randomUUID()

  try {
    const jsonUnknown: unknown = await request.json()
    const parsedReq = AnalyzeProductRequestSchema.safeParse(jsonUnknown)

    if (!parsedReq.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsedReq.error.flatten() }, { status: 400 })
    }

    const body = parsedReq.data

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", request_id }, { status: 401 })
    }

    const hasApiKey = Boolean(process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY)
    if (!hasApiKey) {
      return NextResponse.json({ error: "Server missing OPENAI_API_KEY / OPENROUTER_API_KEY", request_id }, { status: 503 })
    }

    const { data: profileRaw } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle()

    const profile = coerceDbProfile((profileRaw ?? null) as Record<string, unknown> | null)

    const language: "en" | "tr" =
      body.locale === "tr" || profile?.locale === "tr" ? "tr" : body.locale === "en" ? "en" : "en"

    const profileRow = profileRaw as Record<string, unknown> | null
    const displayName = resolveDisplayName({
      profileDisplayName:
        typeof profileRow?.display_name === "string" ? profileRow.display_name : null,
      metadata: user.user_metadata as Record<string, unknown>,
      email: user.email,
      userId: user.id,
    })

    const shelfCompact = body.client_context?.shelf_compact?.slice(0, CONTEXT_CAPS.shelfMax) ?? []

    const profileBlock = formatProfileBlock(profile)
    const shelfBlock = formatShelfBlock({
      ...body,
      client_context: { ...body.client_context, shelf_compact: shelfCompact },
    })
    const routineBlock = formatRoutineBlock(body)
    const futureBuysBlock = formatFutureBuysBlock(body)

    const { data: scanRows } = await supabase
      .from("scan_history")
      .select("product_name, rating, explanation, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_CAPS.scansMax)

    const scansBlock = formatRecentScansBlock(scanRows ?? [])

    let pastRows: Array<{ category: string; normalized_name: string; event_type: string; created_at: string }> = []
    const pastQuery = await supabase
      .from("user_scan_decisions")
      .select("category, normalized_name, event_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_CAPS.pastDecisionsMax)

    if (!pastQuery.error && pastQuery.data) {
      pastRows = pastQuery.data as typeof pastRows
    }

    const pastDecisionsBlock = formatPastDecisionsBlock(pastRows)

    const promptDepth: AnalyzeRequestMode =
      body.mode === "research" ||
      Boolean(profile?.allergies?.length) ||
      shouldPrefetchResearchForShelf(body.product_type_hint ?? null, shelfCompact)
        ? "research"
        : "in_store"

    const maxTokens = promptDepth === "research" ? 2200 : 950

    const openai = createOpenRouterClient()

    let rawContent = await runVisionAnalyze(openai, {
      imageBase64: body.imageBase64,
      depth: promptDepth,
      language,
      displayName,
      profileBlock,
      shelfBlock,
      routineBlock,
      scansBlock,
      futureBuysBlock,
      pastDecisionsBlock,
      maxTokens,
    })

    let validation_result: "ok" | "repaired" | "fallback" = "ok"
    let parsedBody = parseBodyFromContent(rawContent)

    if (!parsedBody) {
      const repairedRaw = rawContent ? await runRepairJson(openai, rawContent) : null
      parsedBody = parseBodyFromContent(repairedRaw)
      validation_result = parsedBody ? "repaired" : "fallback"
    }

    if (!parsedBody) {
      parsedBody = fallbackAnalyzeBody(language)
      validation_result = "fallback"
    }

    const ingredientHaystack = [
      ...(parsedBody.normalized_ingredient_tokens ?? []),
      parsedBody.ingredient_highlights.map((item) => item.name).join(", "),
      parsedBody.flagged_ingredients.map((item) => item.name).join(", "),
    ].join(" | ")

    const allergyHits = findTriggeredAllergens(profile?.allergies ?? undefined, parsedBody.normalized_ingredient_tokens, ingredientHaystack)

    const workingBody = applyAllergenOverrideBody(parsedBody, allergyHits)

    const needsFullDepth =
      body.mode === "research" ||
      allergyHits.length > 0 ||
      workingBody.score <= 3 ||
      workingBody.verdict === "Dangerous" ||
      Boolean(workingBody.shelf_match?.found)

    let finalResult = attachAnalyzeMode(workingBody, needsFullDepth ? "research" : "in_store")

    if (!needsFullDepth && body.mode === "in_store") {
      finalResult = trimToPicklyNow(finalResult)
    }

    const envelopeParsed = PicklyApiEnvelopeSchema.safeParse({
      request_id,
      prompt_version: PICKLY_PROMPT_VERSION,
      model_id: picklyModelId(),
      validation_result,
      context_stats: {
        shelf_items_sent: shelfCompact.length,
        scans_sent: scanRows?.length ?? 0,
        past_decisions_sent: pastRows.length,
      },
      result: finalResult,
    })

    let envelope = envelopeParsed.success ? envelopeParsed.data : null

    if (!envelope) {
      const fallbackBodyResolved = fallbackAnalyzeBody(language)
      const trimmedFallback =
        body.mode === "in_store"
          ? trimToPicklyNow(attachAnalyzeMode(fallbackBodyResolved, "in_store"))
          : attachAnalyzeMode(fallbackBodyResolved, "research")

      envelope = PicklyApiEnvelopeSchema.parse({
        request_id,
        prompt_version: PICKLY_PROMPT_VERSION,
        model_id: picklyModelId(),
        validation_result: "fallback",
        context_stats: {
          shelf_items_sent: shelfCompact.length,
          scans_sent: scanRows?.length ?? 0,
          past_decisions_sent: pastRows.length,
        },
        result: trimmedFallback,
      })
    }

    const insertExtended: ScanHistoryInsert = {
      user_id: user.id,
      image_url: "pickly-camera-scan",
      product_name: envelope.result.productName,
      rating: envelope.result.score,
      explanation: envelope.result.recommended_action || envelope.result.personalized_why[0] || "",
      recommendations: envelope.result.quick_prompts.length ? envelope.result.quick_prompts : envelope.result.personalized_why,
      user_profile_snapshot: profile ?? {},
      analysis_json: envelope.result as Json,
      analyze_mode: body.mode,
      effective_mode: envelope.result.mode,
      product_brand: envelope.result.brand,
      product_category: envelope.result.category,
    }

    const insertMinimal: ScanHistoryInsert = {
      user_id: user.id,
      image_url: "pickly-camera-scan",
      product_name: envelope.result.productName,
      rating: envelope.result.score,
      explanation: envelope.result.recommended_action || envelope.result.personalized_why[0] || "",
      recommendations: envelope.result.quick_prompts.length ? envelope.result.quick_prompts : envelope.result.personalized_why,
      user_profile_snapshot: profile ?? {},
    }

    const extendedTry = await supabase.from("scan_history").insert(insertExtended)
    if (extendedTry.error) {
      console.warn("[analyze-product] extended scan_history insert skipped:", extendedTry.error.message)
      const legacyTry = await supabase.from("scan_history").insert(insertMinimal)
      if (legacyTry.error) {
        console.warn("[analyze-product] legacy scan_history insert failed:", legacyTry.error.message)
      }
    }

    return NextResponse.json(envelope)
  } catch (error) {
    console.error("[analyze-product] fatal:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze product",
        details: error instanceof Error ? error.message : "unknown",
        request_id,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Analyze API (Pickly orchestrator)",
    prompt_version: PICKLY_PROMPT_VERSION,
    hasOpenRouterKey: Boolean(process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY),
    model_id_default: picklyModelId(),
    timestamp: new Date().toISOString(),
  })
}
