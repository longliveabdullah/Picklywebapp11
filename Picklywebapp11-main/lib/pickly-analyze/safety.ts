import type { PicklyAnalyzeBody, PicklyVerdict } from "@/lib/pickly-analyze/schema"

/** v1 token match — normalized lowercase substring or token equality. */
function normalizeAllergy(raw: string): string {
  return raw.toLowerCase().trim().normalize("NFKD")
}

/** True if allergy term appears meaningfully inside any ingredient blob / token line. */
function allergyMatchesIngredient(allergyNorm: string, ingredientLine: string): boolean {
  const line = ingredientLine.toLowerCase()
  if (!allergyNorm || !line) return false
  if (line.includes(allergyNorm)) return true
  const tokens = line.split(/[,/\s]+/).filter(Boolean)
  return tokens.some((t) => t === allergyNorm || t.endsWith(allergyNorm) || allergyNorm.endsWith(t))
}

export function findTriggeredAllergens(
  allergyList: string[] | null | undefined,
  normalizedTokens: string[] | undefined,
  ingredientConcat: string | undefined,
): string[] {
  if (!allergyList?.length) return []
  const hayLines: string[] = []
  if (ingredientConcat) hayLines.push(ingredientConcat)
  normalizedTokens?.forEach((t) => hayLines.push(t))
  if (hayLines.length === 0) return []

  const hits: string[] = []
  for (const allergy of allergyList) {
    const norm = normalizeAllergy(allergy)
    if (!norm) continue
    for (const line of hayLines) {
      if (allergyMatchesIngredient(norm, line)) {
        hits.push(allergy)
        break
      }
    }
  }
  return Array.from(new Set(hits))
}

/**
 * Overrides model output when an allergen is detected in grounded ingredient text (v1 heuristic).
 */
export function applyAllergenOverrideBody(
  result: PicklyAnalyzeBody,
  triggeredAllergens: string[],
): PicklyAnalyzeBody {
  if (triggeredAllergens.length === 0) return result

  const language = result.language
  const note =
    language === "tr"
      ? `Bilinen alerjin listende geçtiği görünüyor (${triggeredAllergens.join(", ")}). Güvenlik için bu ürün sana tehlikeli.`
      : `This product appears to contain something on your allergy list (${triggeredAllergens.join(", ")}). Pickly treats that as unsafe for you.`

  const prepend = [note, ...result.personalized_why].slice(0, 8)

  return {
    ...result,
    score: Math.min(result.score, 2),
    verdict: "Dangerous" as PicklyVerdict,
    personalized_why: prepend,
  }
}
