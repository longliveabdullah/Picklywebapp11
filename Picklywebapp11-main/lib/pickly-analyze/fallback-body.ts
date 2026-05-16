import type { PicklyAnalyzeBody } from "@/lib/pickly-analyze/schema"

export function fallbackAnalyzeBody(language: "en" | "tr"): PicklyAnalyzeBody {
  if (language === "tr") {
    return {
      language: "tr",
      score: 5,
      verdict: "Good, watch out",
      productName: "Ürün",
      brand: null,
      category: "Belirsiz",
      normalized_ingredient_tokens: [],
      personalized_why: [
        "Şu an görüntüden içerikleri güvenle okuyamıyorum — Pickly bunu genel bir özet olarak işaretliyor.",
        "Satın almadan önce etiketi daha net bir fotoğrafla yeniden tara.",
      ],
      shelf_match: null,
      routine_fit: null,
      ingredient_highlights: [],
      flagged_ingredients: [],
      profile_inputs_used: ["scan_fallback"],
      recommended_action: "Daha net bir etiket fotoğrafı çek ve yeniden dene.",
      quick_prompts: [
        "Bu ürün içeriği için daha net fotoğraf nasıl çekilir?",
        "Bu kategori için rutinime nasıl oturturum?",
        "Benzer ama daha güvenli bir seçenek önerir misin?",
      ],
    }
  }

  return {
    language: "en",
    score: 5,
    verdict: "Good, watch out",
    productName: "Product",
    brand: null,
    category: "Unknown",
    normalized_ingredient_tokens: [],
    personalized_why: [
      "Pickly could not confidently read ingredients from this scan — treating this as a soft result.",
      "Retake with a sharper photo of the ingredient list before you buy.",
    ],
    shelf_match: null,
    routine_fit: null,
    ingredient_highlights: [],
    flagged_ingredients: [],
    profile_inputs_used: ["scan_fallback"],
    recommended_action: "Retake with better lighting focused on the ingredient panel.",
    quick_prompts: [
      "How do I scan ingredients more reliably?",
      "Where would this slot into my routine?",
      "Suggest a safer alternative for my profile",
    ],
  }
}
