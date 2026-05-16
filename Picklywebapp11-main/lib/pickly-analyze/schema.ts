import { z } from "zod"

export const PicklyVerdictSchema = z.enum(["Excellent match", "Good, watch out", "Not recommended", "Dangerous"])

export type PicklyVerdict = z.infer<typeof PicklyVerdictSchema>

export const AnalyzeModeSchema = z.enum(["in_store", "research"])
export type AnalyzeRequestMode = z.infer<typeof AnalyzeModeSchema>

export const ProductTypeHintSchema = z.enum(["skincare", "haircare", "fragrance", "makeup"]).nullable().optional()

const shelfMatchNullable = z
  .object({
    found: z.boolean(),
    product_name: z.string().nullable(),
    relationship: z.string(),
  })
  .nullable()

const routineFitNullable = z
  .object({
    slot: z.string(),
    conflicts: z.array(z.string()),
  })
  .nullable()

/** Parsed model JSON before server attaches `mode`. */
export const PicklyAnalyzeBodySchema = z.object({
  language: z.enum(["en", "tr"]),
  score: z.number().min(0).max(10),
  verdict: PicklyVerdictSchema,
  productName: z.string().min(1),
  brand: z.string().nullable(),
  category: z.string().min(1),
  normalized_ingredient_tokens: z.array(z.string()).optional(),
  personalized_why: z.array(z.string()),
  shelf_match: shelfMatchNullable,
  routine_fit: routineFitNullable,
  ingredient_highlights: z.array(
    z.object({
      name: z.string(),
      relevance: z.string(),
    }),
  ),
  flagged_ingredients: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
    }),
  ),
  profile_inputs_used: z.array(z.string()),
  recommended_action: z.string(),
  quick_prompts: z.array(z.string()),
})

export type PicklyAnalyzeBody = z.infer<typeof PicklyAnalyzeBodySchema>

/** Unified schema returned to the client (`mode` set server-side). */
export const PicklyAnalyzeResultSchema = PicklyAnalyzeBodySchema.extend({
  mode: AnalyzeModeSchema,
})

export type PicklyAnalyzeResult = z.infer<typeof PicklyAnalyzeResultSchema>

export const AnalyzeProductRequestSchema = z.object({
  imageBase64: z.string().min(50),
  mode: AnalyzeModeSchema,
  locale: z.enum(["en", "tr"]).optional(),
  product_type_hint: ProductTypeHintSchema,
  scan_id: z.string().optional().nullable(),
  client_context: z
    .object({
      shelf_compact: z
        .array(
          z.object({
            product_name: z.string(),
            brand: z.string().optional(),
            category: z.string(),
          }),
        )
        .optional(),
      future_buys: z
        .array(
          z.object({
            product_name: z.string(),
            category: z.string().optional(),
          }),
        )
        .optional(),
      routine_compact: z
        .object({
          am: z.string(),
          pm: z.string(),
        })
        .optional(),
    })
    .optional(),
})

export type AnalyzeProductRequest = z.infer<typeof AnalyzeProductRequestSchema>

export const PicklyApiEnvelopeSchema = z.object({
  request_id: z.string(),
  prompt_version: z.string(),
  model_id: z.string(),
  validation_result: z.enum(["ok", "repaired", "fallback"]),
  context_stats: z.object({
    shelf_items_sent: z.number(),
    scans_sent: z.number(),
    past_decisions_sent: z.number(),
  }),
  result: PicklyAnalyzeResultSchema,
})

export type PicklyApiEnvelope = z.infer<typeof PicklyApiEnvelopeSchema>

export function attachAnalyzeMode(body: PicklyAnalyzeBody, mode: AnalyzeRequestMode): PicklyAnalyzeResult {
  return { ...body, mode }
}
