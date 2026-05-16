export type ShelfCategory = "skin" | "makeup" | "hair" | "body" | "fragrance"

/** Colour accent + readable label used in Wallet, Home, Products pages. */
export const categoryMeta: Record<ShelfCategory, { accent: string; label: string }> = {
  skin: { accent: "#A7AD89", label: "Skincare" },
  makeup: { accent: "#B69C85", label: "Makeup" },
  hair: { accent: "#8C916C", label: "Haircare" },
  body: { accent: "#DBD0C4", label: "Body" },
  fragrance: { accent: "#92735C", label: "Fragrance" },
}

/** Display fields derived from category; DB stores category + price (shelf = SSOT for money). */
export const shelfPresentationByCategory: Record<
  ShelfCategory,
  { tag: string; icon: string; clean_score: number }
> = {
  skin: { tag: "CLEAN PICK", icon: "✨", clean_score: 88 },
  makeup: { tag: "SIGNATURE LOOK", icon: "💄", clean_score: 79 },
  hair: { tag: "SELF-CARE", icon: "💆", clean_score: 83 },
  body: { tag: "DAILY ESSENTIAL", icon: "🫧", clean_score: 84 },
  fragrance: { tag: "SCENT MOOD", icon: "🌸", clean_score: 76 },
}
