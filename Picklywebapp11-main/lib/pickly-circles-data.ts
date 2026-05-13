import type { UserProfile } from "@/types"

export interface CircleUser {
  id: string
  name: string
  username: string
  headline: string
  skinType?: UserProfile["skinType"]
  hairType?: string
  vegan?: boolean
  skinConcerns?: string[]
  hairConcerns?: string[]
  goals?: string[]
  extraTags: string[]
  favoriteProducts: string[]
}

export interface CircleGroup {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: string
  activityLabel: string
  accent: string
}

export interface RelevantReview {
  id: string
  authorId: string
  productName: string
  quote: string
  relevanceLine: string
}

export const suggestedSearchTags = [
  "Sensitive Skin",
  "3A Curly",
  "Budget Beauty",
  "Fragrance-Free",
  "Oily Skin",
  "Summer Perfumes",
]

export const circleUsers: CircleUser[] = [
  {
    id: "u1",
    name: "Aylin Glow",
    username: "@aylin.glow",
    headline: "Barrier-first skincare, fragrance-light picks, soft glam only.",
    skinType: "dry",
    hairType: "3a_curly",
    vegan: true,
    skinConcerns: ["dryness", "dark_spots"],
    hairConcerns: ["frizz", "curl_definition"],
    goals: ["hydration", "shinier_hair"],
    extraTags: ["Budget Minded", "Fragrance-Light", "Routine Consistency"],
    favoriteProducts: ["Ceramide Moisturizer", "Chance Eau Tendre", "Vitamin C Serum"],
  },
  {
    id: "u2",
    name: "Lina Clear",
    username: "@lina.clear",
    headline: "Acne-prone and sensitive skin, minimalist routines, no fluff.",
    skinType: "sensitive",
    hairType: "2b_wavy",
    vegan: false,
    skinConcerns: ["acne", "dryness"],
    hairConcerns: ["oily_scalp"],
    goals: ["healthy_scalp", "hydration"],
    extraTags: ["Fragrance-Free", "Budget Skincare", "Clean Beauty"],
    favoriteProducts: ["Gentle Gel Cleanser", "SPF 50 Sunscreen", "Retinol Night Cream"],
  },
  {
    id: "u3",
    name: "Duru Curls",
    username: "@durucurls",
    headline: "3B/3C curl lover, moisture layering, soft definition over crunch.",
    skinType: "combination",
    hairType: "3b_curly",
    vegan: true,
    skinConcerns: ["aging"],
    hairConcerns: ["curl_definition", "shrinkage", "dryness"],
    goals: ["curl_definition", "less_frizz", "hydration"],
    extraTags: ["Curly Hair", "Wash Day Rituals", "Low Heat"],
    favoriteProducts: ["Argan Oil Mask", "Ceramide Moisturizer", "Black Opium"],
  },
  {
    id: "u4",
    name: "Mina Muse",
    username: "@mina.muse",
    headline: "Luxury textures, signature scents, and polished routines.",
    skinType: "normal",
    hairType: "1c_straight",
    vegan: false,
    skinConcerns: ["dark_spots"],
    hairConcerns: ["shine", "volume"],
    goals: ["shinier_hair", "volume"],
    extraTags: ["Luxury Beauty", "Perfume Wardrobe", "Night Routines"],
    favoriteProducts: ["Libre Intense", "Light Blue", "Matte Lipstick"],
  },
]

export const circles: CircleGroup[] = [
  {
    id: "c1",
    name: "Sensitive Skin Circle",
    description: "Gentle routines, low-irritation favorites, and trusted barrier-safe swaps.",
    tags: ["Sensitive", "Acne-Prone", "Barrier Repair"],
    memberCount: "4.8k",
    activityLabel: "Very active",
    accent: "#A7AD89",
  },
  {
    id: "c2",
    name: "3A-3C Curl Circle",
    description: "Definition-first routines, moisture layering, and curl-friendly product picks.",
    tags: ["Curly", "Frizz Control", "Hydration"],
    memberCount: "3.1k",
    activityLabel: "Daily posts",
    accent: "#8C916C",
  },
  {
    id: "c3",
    name: "Budget Beauty Picks",
    description: "High-value products and smarter swaps for shelves that stay effective and affordable.",
    tags: ["Budget", "Drugstore", "Worth It"],
    memberCount: "5.4k",
    activityLabel: "Trending",
    accent: "#B69C85",
  },
  {
    id: "c4",
    name: "Fragrance-Free Finds",
    description: "For users who want cleaner, low-scent, low-trigger skincare and haircare.",
    tags: ["Fragrance-Free", "Sensitive", "Minimalist"],
    memberCount: "2.2k",
    activityLabel: "High trust",
    accent: "#DBD0C4",
  },
  {
    id: "c5",
    name: "Summer Scents Society",
    description: "Fresh daytime perfumes, warm-weather layering, and signature summer bottles.",
    tags: ["Perfumes", "Summer", "Morning"],
    memberCount: "1.9k",
    activityLabel: "Seasonal buzz",
    accent: "#92735C",
  },
]

export const relevantReviews: RelevantReview[] = [
  {
    id: "r1",
    authorId: "u2",
    productName: "Gentle Gel Cleanser",
    quote: "Finally a cleanser that doesn't leave my skin tight by the second week. It feels calm, not stripped.",
    relevanceLine: "Relevant because they also have sensitive, acne-prone skin.",
  },
  {
    id: "r2",
    authorId: "u3",
    productName: "Argan Oil Mask",
    quote: "Best used after a deep wash day. It gave me softer curl definition without weighing my ends down.",
    relevanceLine: "Relevant because they share curl-definition and hydration goals.",
  },
  {
    id: "r3",
    authorId: "u1",
    productName: "Ceramide Moisturizer",
    quote: "This is one of those products I keep rebuying. It makes my routine feel expensive even when the rest is simple.",
    relevanceLine: "Relevant because they also focus on dryness and barrier support.",
  },
]

function normalized(value?: string) {
  return value?.toLowerCase().trim()
}

function titleCaseTag(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function buildProfileTags(profile: UserProfile) {
  const tags: string[] = []

  if (profile.skinType) tags.push(`${titleCaseTag(profile.skinType)} Skin`)
  if (profile.hairType) tags.push(hairTypeLabel(profile.hairType))
  if (profile.vegan) tags.push("Vegan")
  if (profile.skinConcerns?.[0]) tags.push(titleCaseTag(profile.skinConcerns[0]))
  if (profile.hairConditions?.[0]) tags.push(titleCaseTag(profile.hairConditions[0]))

  return tags.slice(0, 4)
}

export function hairTypeLabel(value?: string) {
  if (!value) return ""
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function calculateCompatibility(currentProfile: UserProfile, candidate: CircleUser) {
  let score = 55
  const reasons: string[] = []

  if (currentProfile.skinType && candidate.skinType && currentProfile.skinType === candidate.skinType) {
    score += 15
    reasons.push(`Same skin type: ${titleCaseTag(candidate.skinType)}`)
  }

  if (currentProfile.hairType && candidate.hairType && normalized(currentProfile.hairType) === normalized(candidate.hairType)) {
    score += 15
    reasons.push(`Same hair type: ${hairTypeLabel(candidate.hairType)}`)
  }

  if (typeof currentProfile.vegan === "boolean" && typeof candidate.vegan === "boolean" && currentProfile.vegan === candidate.vegan) {
    score += 5
    reasons.push(candidate.vegan ? "Shared vegan preference" : "Shared product values")
  }

  const sharedSkinConcerns = (currentProfile.skinConcerns || []).filter((concern) =>
    (candidate.skinConcerns || []).includes(concern),
  )
  if (sharedSkinConcerns.length > 0) {
    score += Math.min(12, sharedSkinConcerns.length * 4)
    reasons.push(`Shared concerns: ${sharedSkinConcerns.map(titleCaseTag).join(", ")}`)
  }

  const sharedHairConcerns = (currentProfile.hairConditions || []).filter((concern) =>
    (candidate.hairConcerns || []).includes(concern),
  )
  if (sharedHairConcerns.length > 0) {
    score += Math.min(9, sharedHairConcerns.length * 3)
    reasons.push(`Shared hair priorities: ${sharedHairConcerns.map(titleCaseTag).join(", ")}`)
  }

  const sharedGoals = (currentProfile.goals || []).filter((goal) => (candidate.goals || []).includes(goal))
  if (sharedGoals.length > 0) {
    score += Math.min(8, sharedGoals.length * 2)
    reasons.push(`Similar goals: ${sharedGoals.map(titleCaseTag).join(", ")}`)
  }

  return {
    score: Math.min(98, score),
    reasons: reasons.slice(0, 2),
  }
}

export function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase())
}
