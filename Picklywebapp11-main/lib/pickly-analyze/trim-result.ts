import { CONTEXT_CAPS } from "@/lib/pickly-analyze/constants"
import type { PicklyAnalyzeResult } from "@/lib/pickly-analyze/schema"

/** Pickly Now: trim heavy fields but keep shelf/routine insights the model already produced. */
export function trimToPicklyNow(result: PicklyAnalyzeResult): PicklyAnalyzeResult {
  return {
    ...result,
    mode: "in_store",
    personalized_why: result.personalized_why.slice(0, CONTEXT_CAPS.inStoreWhyMax),
    ingredient_highlights: [],
    flagged_ingredients: [],
    profile_inputs_used: [],
    recommended_action: "",
    quick_prompts: [],
  }
}
