import { CONTEXT_CAPS } from "@/lib/pickly-analyze/constants"
import type { PicklyAnalyzeResult } from "@/lib/pickly-analyze/schema"

/** Pickly Now: same schema, sparse fields filled with empties/nulls except score / verdict / first two personalized_why. */
export function trimToPicklyNow(result: PicklyAnalyzeResult): PicklyAnalyzeResult {
  return {
    ...result,
    mode: "in_store",
    personalized_why: result.personalized_why.slice(0, CONTEXT_CAPS.inStoreWhyMax),
    shelf_match: null,
    routine_fit: null,
    ingredient_highlights: [],
    flagged_ingredients: [],
    profile_inputs_used: [],
    recommended_action: "",
    quick_prompts: [],
  }
}
