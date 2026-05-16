import {
  routineTypeMeta,
  type RoutineSelection,
  type RoutineType,
  type SharedShelfProduct,
  type ShelfCategory,
} from "@/lib/pickly-mock-data"
import type { ProductRating, UserProfile } from "@/types"

export type ResultMode = "in_store" | "researching"
export type VerdictTone = "excellent" | "watch_out" | "not_recommended" | "danger" | "limited_data"
export type HeroTheme = "terracotta" | "amber" | "sage" | "green" | "neutral"

export type ResultActionId =
  | "save_to_shelf"
  | "routine_fit"
  | "compare_with_shelf"
  | "safer_alternative"
  | "why_unsafe"
  | "complete_profile"
  | "use_now"
  | "scan_again"

type ScanResultAction = {
  id: ResultActionId
  label: string
  emphasis: "primary" | "secondary"
}

type ShelfSimilarity = {
  title: string
  message: string
  tone: "positive" | "caution" | "neutral"
}

type RoutineTimelineItem = {
  label: string
  active: boolean
  productName?: string
}

type RoutineFitInsight = {
  title: string
  slotLabel: string
  message: string
  timeline: RoutineTimelineItem[]
}

type ProfileUsage = {
  used: string[]
  missing: string[]
}

type InferredProductMeta = {
  category: ShelfCategory
  categoryLabel: string
  routineType?: RoutineType
  routineLabel?: string
  primaryPeriod: "am" | "pm"
  periodLabel: "AM" | "PM" | "AM / PM"
}

export type ScanResultViewModel = {
  score: number
  displayScore: string
  mode: ResultMode
  modeLabel: string
  verdict: VerdictTone
  verdictTitle: string
  verdictSubtitle: string
  immediateAction: string
  heroTheme: HeroTheme
  productName: string
  categoryLabel: string
  personalizedReasons: string[]
  shelfSimilarity: ShelfSimilarity
  routineFit: RoutineFitInsight
  profileUsage: ProfileUsage
  evidenceSummary: string
  reasonsToBuy: string[]
  reasonsToAvoid: string[]
  quickPrompts: string[]
  actions: ScanResultAction[]
  inferredProduct: InferredProductMeta
}

export type ScanModeInfo = {
  title: string
  tagline: string
  headline: string
  bestFor: string
  includes: string[]
  purpose: string
  footnote: string
}

export const resultModeOptions: Array<{
  id: ResultMode
  label: string
  description: string
  tagline: string
  info: ScanModeInfo
}> = [
  {
    id: "in_store",
    label: "Pickly Now",
    tagline: "The moment is now",
    description: "A clear call while you're shopping",
    info: {
      title: "Pickly Now",
      tagline: "Quick & confident",
      headline: "A personal verdict you can act on immediately — built for real shopping moments.",
      bestFor:
        "You're in the store or ready to buy today and want a straight answer: take it, leave it, or pause.",
      includes: [
        "Clear verdict tied to your profile",
        "What to do in the next minute",
        "Focused reasoning without overwhelm",
        "Confidence before checkout",
      ],
      purpose:
        "Pickly Now is not a \"lite\" scan. It is the right depth when time is short and the decision is happening now.",
      footnote: "Speed here means clarity — not skipping what matters for you.",
    },
  },
  {
    id: "researching",
    label: "Pickly Deep",
    tagline: "You have time",
    description: "The full picture, at your pace",
    info: {
      title: "Pickly Deep",
      tagline: "Rich & thorough",
      headline: "A complete read when you want to understand the product before you commit.",
      bestFor:
        "You're at home, comparing options, or want ingredients, tradeoffs, and context before spending.",
      includes: [
        "Full breakdown of fit and tradeoffs",
        "Evidence and recommendations to review",
        "Shelf and routine alignment",
        "Follow-up questions until it clicks",
      ],
      purpose:
        "More detail is not slower or worse — it is Pickly at full strength when you have time to decide well.",
      footnote: "Take your time. This mode is made for comparison, curiosity, and peace of mind.",
    },
  },
]

const categoryLabelMap: Record<ShelfCategory, string> = {
  skin: "Skincare",
  makeup: "Makeup",
  hair: "Haircare",
  body: "Body Care",
  fragrance: "Fragrance",
}

const routineOrder: RoutineType[] = ["cleanser", "serum", "treatment", "moisturizer", "oil", "spf"]

function normalize(value: string | undefined | null) {
  return (value || "").toLowerCase()
}

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function inferProductMeta(productRating: ProductRating): InferredProductMeta {
  const productText = [
    productRating.productName,
    productRating.explanation,
    productRating.summary,
    ...(productRating.reasonsToBuy || []),
    ...(productRating.reasonsToAvoid || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (/(perfume|fragrance|eau|cologne|mist)/.test(productText)) {
    return {
      category: "fragrance",
      categoryLabel: categoryLabelMap.fragrance,
      primaryPeriod: "am",
      periodLabel: "AM / PM",
    }
  }

  if (/(shampoo|conditioner|scalp|curl|hair|mask)/.test(productText)) {
    if (/(oil|serum)/.test(productText)) {
      return {
        category: "hair",
        categoryLabel: categoryLabelMap.hair,
        routineType: "oil",
        routineLabel: routineTypeMeta.oil.label,
        primaryPeriod: "pm",
        periodLabel: "PM",
      }
    }

    return {
      category: "hair",
      categoryLabel: categoryLabelMap.hair,
      primaryPeriod: "pm",
      periodLabel: "AM / PM",
    }
  }

  if (/(body wash|body lotion|body cream|deodorant|soap)/.test(productText)) {
    return {
      category: "body",
      categoryLabel: categoryLabelMap.body,
      primaryPeriod: "am",
      periodLabel: "AM / PM",
    }
  }

  if (/(lipstick|blush|foundation|concealer|mascara|makeup)/.test(productText)) {
    return {
      category: "makeup",
      categoryLabel: categoryLabelMap.makeup,
      primaryPeriod: "am",
      periodLabel: "AM",
    }
  }

  if (/(spf|sunscreen|sun screen)/.test(productText)) {
    return {
      category: "skin",
      categoryLabel: categoryLabelMap.skin,
      routineType: "spf",
      routineLabel: routineTypeMeta.spf.label,
      primaryPeriod: "am",
      periodLabel: "AM",
    }
  }

  if (/(retinol|acid|exfoliant|treatment)/.test(productText)) {
    return {
      category: "skin",
      categoryLabel: categoryLabelMap.skin,
      routineType: "treatment",
      routineLabel: routineTypeMeta.treatment.label,
      primaryPeriod: "pm",
      periodLabel: "PM",
    }
  }

  if (/(serum|vitamin c|niacinamide|hyaluronic)/.test(productText)) {
    return {
      category: "skin",
      categoryLabel: categoryLabelMap.skin,
      routineType: "serum",
      routineLabel: routineTypeMeta.serum.label,
      primaryPeriod: "am",
      periodLabel: "AM / PM",
    }
  }

  if (/(cleanser|wash|gel|foam|micellar)/.test(productText)) {
    return {
      category: "skin",
      categoryLabel: categoryLabelMap.skin,
      routineType: "cleanser",
      routineLabel: routineTypeMeta.cleanser.label,
      primaryPeriod: "am",
      periodLabel: "AM / PM",
    }
  }

  return {
    category: "skin",
    categoryLabel: categoryLabelMap.skin,
    routineType: "moisturizer",
    routineLabel: routineTypeMeta.moisturizer.label,
    primaryPeriod: "am",
    periodLabel: "AM / PM",
  }
}

function inferVerdict(productRating: ProductRating): VerdictTone {
  const apiVerdict = productRating.picklyEnvelope?.result.verdict
  if (apiVerdict === "Excellent match") return "excellent"
  if (apiVerdict === "Good, watch out") return "watch_out"
  if (apiVerdict === "Not recommended") return "not_recommended"
  if (apiVerdict === "Dangerous") return "danger"

  const score = productRating.rating
  const content = normalize(
    [productRating.explanation, productRating.summary, ...(productRating.reasonsToAvoid || [])].join(" "),
  )

  if (score < 0 || normalize(productRating.productName).includes("unrecognized")) {
    return "limited_data"
  }

  if (content.includes("danger") || content.includes("unsafe")) {
    return "danger"
  }

  if (score === 0) {
    return "danger"
  }

  if (score >= 9) {
    return "excellent"
  }

  if (score >= 6) {
    return "watch_out"
  }

  return "not_recommended"
}

function inferTheme(score: number): HeroTheme {
  if (score < 0) return "neutral"
  if (score <= 3) return "terracotta"
  if (score <= 6) return "amber"
  if (score <= 8) return "sage"
  return "green"
}

function formatList(values: string[]) {
  if (values.length === 0) return ""
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`
}

function buildProfileUsage(profile?: UserProfile): ProfileUsage {
  const entries: Array<[string, boolean]> = [
    ["Skin Type", !!profile?.skinType],
    ["Hair Type", !!profile?.hairType],
    ["Scalp Type", !!profile?.scalpType],
    ["Allergies", !!profile?.allergies?.length],
    ["Goals", !!profile?.goals?.length],
    ["Vegan Preference", !!profile?.vegan],
    ["Age", !!profile?.age],
    ["Diabetes", profile?.hasDiabetes !== undefined],
  ]

  return {
    used: entries.filter(([, enabled]) => enabled).map(([label]) => label),
    missing: entries.filter(([, enabled]) => !enabled).map(([label]) => label),
  }
}

function buildPersonalizedReasons(
  productRating: ProductRating,
  profile: UserProfile | undefined,
  verdict: VerdictTone,
  inferredProduct: InferredProductMeta,
) {
  const backendReasons = productRating.picklyEnvelope?.result.personalized_why
  if (backendReasons?.length) {
    return unique(backendReasons).slice(0, 5)
  }

  const reasons: string[] = []

  if (verdict === "limited_data") {
    return [
      "Pickly could not confidently identify this product from the current scan, so the safest move is a clearer photo of the front label or ingredient list.",
      "Use this as a soft result only, not a buying decision yet.",
    ]
  }

  if (profile?.allergies?.length) {
    reasons.push(
      `This score was checked against your allergy list (${formatList(profile.allergies.slice(0, 2))}), so it is not a generic shelf score.`,
    )
  }

  if (inferredProduct.category === "skin" && profile?.skinType) {
    if (verdict === "excellent") {
      reasons.push(`For your ${profile.skinType} skin, this looks like a cleaner fit than a random shelf pick.`)
    } else if (verdict === "danger") {
      reasons.push(`For your ${profile.skinType} skin, this reads as a higher-risk pick and should be treated cautiously.`)
    } else {
      reasons.push(`For your ${profile.skinType} skin, this comes with tradeoffs rather than a clear yes.`)
    }
  }

  if (inferredProduct.category === "hair" && (profile?.scalpType || profile?.hairConditions?.length)) {
    if (profile.scalpType) {
      reasons.push(`Your ${profile.scalpType} scalp profile was considered before this result was shown.`)
    }
    if (profile.hairConditions?.length) {
      reasons.push(`This was weighed against your reported ${humanize(profile.hairConditions[0])} concern.`)
    }
  }

  if (profile?.goals?.length) {
    const goal = humanize(profile.goals[0])
    if (verdict === "excellent") {
      reasons.push(`This appears more aligned with your ${goal.toLowerCase()} goal than a generic recommendation.`)
    } else {
      reasons.push(`This does not look strongly aligned with your ${goal.toLowerCase()} goal, so it may underdeliver for you.`)
    }
  }

  if (profile?.vegan) {
    reasons.push("Your vegan preference was included in the decision, so this result aims to be value-aware as well as performance-aware.")
  }

  const firstAvoid = productRating.reasonsToAvoid?.[0]
  if (firstAvoid) {
    reasons.push(`Main tradeoff: ${firstAvoid}`)
  }

  const firstBuy = productRating.reasonsToBuy?.[0]
  if (firstBuy && verdict !== "danger") {
    reasons.push(`Main upside: ${firstBuy}`)
  }

  if (reasons.length === 0) {
    reasons.push("This result is still leaning on general scan logic because your profile is only partially filled in.")
  }

  return unique(reasons).slice(0, 4)
}

function buildShelfSimilarity(
  productRating: ProductRating,
  productName: string,
  inferredProduct: InferredProductMeta,
  shelfProducts: SharedShelfProduct[],
): ShelfSimilarity {
  const apiShelf = productRating.picklyEnvelope?.result.shelf_match
  if (apiShelf?.found && apiShelf.relationship) {
    const suffix = apiShelf.product_name ? ` Related shelf item: ${apiShelf.product_name}.` : ""
    return {
      title: "Shelf Match",
      message: `${apiShelf.relationship}${suffix}`,
      tone: /risk|overload|duplicate|conflict/i.test(apiShelf.relationship) ? "caution" : "neutral",
    }
  }

  const normalizedName = normalize(productName)
  const exactMatch = shelfProducts.find((product) => normalize(product.product_name) === normalizedName)

  if (exactMatch) {
    return {
      title: "Shelf Similarity",
      message: `You already have ${exactMatch.product_name} on your shelf, so this scan is more of a reconfirmation than a new discovery.`,
      tone: "positive",
    }
  }

  const sameRoutine = shelfProducts.filter((product) => inferredProduct.routineType && product.routine_type === inferredProduct.routineType)
  if (sameRoutine.length >= 2 && inferredProduct.routineLabel) {
    return {
      title: "Shelf Similarity",
      message: `You already own ${sameRoutine.length} products that cover the ${inferredProduct.routineLabel.toLowerCase()} slot, so adding this may be redundant unless it clearly outperforms them.`,
      tone: "caution",
    }
  }

  const sameCategory = shelfProducts.find((product) => product.category === inferredProduct.category)
  if (sameCategory) {
    return {
      title: "Shelf Similarity",
      message: `You already have ${sameCategory.product_name} on your shelf, and this scan looks close in category and function.`,
      tone: "neutral",
    }
  }

  return {
    title: "Shelf Similarity",
    message: "Nothing close on your shelf yet, so this could fill a genuinely new role in your lineup.",
    tone: "positive",
  }
}

function buildRoutineFit(
  productRating: ProductRating,
  inferredProduct: InferredProductMeta,
  routine: { am: RoutineSelection[]; pm: RoutineSelection[] },
  shelfProducts: SharedShelfProduct[],
): RoutineFitInsight {
  const apiRoutine = productRating.picklyEnvelope?.result.routine_fit
  if (apiRoutine?.slot) {
    return {
      title: "Routine Fit",
      slotLabel: apiRoutine.slot,
      message:
        apiRoutine.conflicts.length > 0
          ? apiRoutine.conflicts.join(" ")
          : `Pickly mapped this toward ${apiRoutine.slot} based on your routine snapshot.`,
      timeline: [],
    }
  }

  if (!inferredProduct.routineType) {
    return {
      title: "Routine Fit",
      slotLabel: inferredProduct.categoryLabel,
      message: "This does not map cleanly to a single AM or PM routine slot, so treat it more like an occasional add-on than a step anchor.",
      timeline: [],
    }
  }

  const timeline = routineOrder.map((type) => {
    const matchedStep = routine[inferredProduct.primaryPeriod].find((step) => step.type === type)
    const matchedProduct = matchedStep
      ? shelfProducts.find((product) => product.id === matchedStep.productId)
      : undefined

    return {
      label: routineTypeMeta[type].label,
      active: inferredProduct.routineType === type,
      productName: matchedProduct?.product_name,
    }
  })

  const existingMatch = timeline.find((step) => step.active && step.productName)

  return {
    title: "Routine Fit",
    slotLabel: `${inferredProduct.periodLabel} ${inferredProduct.routineLabel}`,
    message: existingMatch?.productName
      ? `Best used as your ${inferredProduct.periodLabel.toLowerCase()} ${inferredProduct.routineLabel?.toLowerCase()}. You already use ${existingMatch.productName} here, so this would be a swap rather than an add.`
      : `Best used as your ${inferredProduct.periodLabel.toLowerCase()} ${inferredProduct.routineLabel?.toLowerCase()}. This could slot in without fighting the rest of your routine.`,
    timeline,
  }
}

function buildVerdictCopy(verdict: VerdictTone, mode: ResultMode, productName: string) {
  switch (verdict) {
    case "excellent":
      return {
        title: "Excellent match for you",
        subtitle:
          mode === "in_store"
            ? "This is a confident yes. You can treat this as a small win, not another aisle debate."
            : `This looks like one of the better-fit versions of ${productName} for your current profile.`,
        action: mode === "in_store" ? "Buy with confidence if the price makes sense." : "Worth saving and folding into your routine thinking.",
      }
    case "watch_out":
      return {
        title: "Good, but watch out",
        subtitle:
          mode === "in_store"
            ? "There is upside here, but do not grab it without checking the tradeoffs first."
            : "There is enough upside here, but you should only say yes if the tradeoffs feel worth it.",
        action: mode === "researching" ? "Check the tradeoffs before you buy." : "Do not treat this as an automatic yes.",
      }
    case "danger":
      return {
        title: "Dangerous for your profile",
        subtitle: "Lead with the risk, not the product name. This should be treated as a health-first decision.",
        action: mode === "in_store" ? "Put it back and look for a safer option." : "Skip this one and look for a safer alternative.",
      }
    case "limited_data":
      return {
        title: "Limited data found on this product",
        subtitle: "This is a soft result only. Pickly needs a clearer view before giving you a trustworthy call.",
        action: "Retake the scan before making the decision.",
      }
    default:
      return {
        title: "Not recommended",
        subtitle:
          mode === "in_store"
            ? "This is a weak fit for you right now — not worth adding to your basket."
            : "This feels more like a compromise than a purchase worth making.",
        action: "Look for a better-fit option if you can.",
      }
  }
}

function buildQuickPrompts(mode: ResultMode, verdict: VerdictTone, productRating: ProductRating) {
  const backend = productRating.picklyEnvelope?.result.quick_prompts
  if (backend && backend.length === 3) {
    return backend
  }

  if (verdict === "danger") {
    return [
      "Why is this bad for me?",
      "Can I still use it sometimes?",
      "Suggest a safer alternative",
      "What should I avoid mixing it with?",
    ]
  }

  if (mode === "researching") {
    return [
      "Is this worth buying?",
      "What are the biggest tradeoffs here?",
      "Do I already own something similar?",
      "Does it fit my routine?",
    ]
  }

  return [
    "What do I do right now?",
    "Should I buy this today?",
    "What is the biggest downside?",
    "Does it fit my routine?",
  ]
}

function buildActions(mode: ResultMode, verdict: VerdictTone, profileUsage: ProfileUsage): ScanResultAction[] {
  if (verdict === "limited_data") {
    return [
      { id: "scan_again", label: "Try a Clearer Scan", emphasis: "primary" },
      { id: "compare_with_shelf", label: "Open My Shelf", emphasis: "secondary" },
    ]
  }

  if (verdict === "danger") {
    return [
      { id: "why_unsafe", label: "Why It's Unsafe", emphasis: "primary" },
      {
        id: profileUsage.missing.length > 0 ? "complete_profile" : "safer_alternative",
        label: profileUsage.missing.length > 0 ? "Complete Profile" : "Find Safer Alternative",
        emphasis: "secondary",
      },
    ]
  }

  if (verdict === "not_recommended") {
    return [
      { id: "safer_alternative", label: "Find Safer Alternative", emphasis: "primary" },
      { id: "compare_with_shelf", label: "Compare with My Shelf", emphasis: "secondary" },
    ]
  }

  if (mode === "researching") {
    return [
      { id: "save_to_shelf", label: "Save to Shelf", emphasis: "primary" },
      { id: "compare_with_shelf", label: "Compare with My Shelf", emphasis: "secondary" },
    ]
  }

  return [
    { id: "save_to_shelf", label: "Add to Shelf", emphasis: "primary" },
    { id: "routine_fit", label: "See Routine Fit", emphasis: "secondary" },
  ]
}

export function buildScanResultViewModel(
  productRating: ProductRating,
  profile: UserProfile | undefined,
  shelfProducts: SharedShelfProduct[],
  routine: { am: RoutineSelection[]; pm: RoutineSelection[] },
  mode: ResultMode,
): ScanResultViewModel {
  const inferredProduct = inferProductMeta(productRating)
  const verdict = inferVerdict(productRating)
  const profileUsage = buildProfileUsage(profile)
  const verdictCopy = buildVerdictCopy(verdict, mode, productRating.productName || "this product")

  return {
    score: productRating.rating,
    displayScore: productRating.rating < 0 ? "?" : `${productRating.rating}/10`,
    mode,
    modeLabel: resultModeOptions.find((option) => option.id === mode)?.label || "Pickly Now",
    verdict,
    verdictTitle: verdictCopy.title,
    verdictSubtitle: verdictCopy.subtitle,
    immediateAction: verdictCopy.action,
    heroTheme: inferTheme(productRating.rating),
    productName: productRating.productName || "Scanned Product",
    categoryLabel: inferredProduct.categoryLabel,
    personalizedReasons: buildPersonalizedReasons(productRating, profile, verdict, inferredProduct),
    shelfSimilarity: buildShelfSimilarity(productRating, productRating.productName || "Scanned Product", inferredProduct, shelfProducts),
    routineFit: buildRoutineFit(productRating, inferredProduct, routine, shelfProducts),
    profileUsage,
    evidenceSummary: productRating.summary || productRating.explanation,
    reasonsToBuy: productRating.reasonsToBuy || [],
    reasonsToAvoid: productRating.reasonsToAvoid || [],
    quickPrompts: buildQuickPrompts(mode, verdict, productRating),
    actions: buildActions(mode, verdict, profileUsage),
    inferredProduct,
  }
}

export function buildShelfDraft(viewModel: ScanResultViewModel) {
  const today = new Date().toISOString().split("T")[0]

  return {
    product_name: viewModel.productName,
    brand: "Pickly Scan",
    category: viewModel.inferredProduct.category,
    expiry_date: null,
    period_after_opening: 12,
    status: "sealed" as const,
    purchase_price: 0,
    purchase_date: today,
    routine_type: viewModel.inferredProduct.category === "fragrance" ? undefined : viewModel.inferredProduct.routineType,
    fragrance_moment: undefined,
  }
}
