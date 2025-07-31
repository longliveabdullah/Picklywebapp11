import type { ProductRating } from "@/types"

export async function analyzeProduct(imageBase64: string, userId: string): Promise<ProductRating> {
  try {
    console.log("🔍 Starting product analysis via AI service...")

    const response = await fetch("/api/analyze-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ AI service error:", errorData)
      throw new Error(errorData.error || "Failed to analyze product")
    }

    const data = await response.json()
    console.log("✅ AI service response:", data)

    return {
      rating: data.rating,
      explanation: data.explanation,
      recommendations: data.recommendations,
      productName: data.productName,
      healthScore: data.healthScore,
      suitabilityScore: data.suitabilityScore,
    }
  } catch (error) {
    console.error("❌ Error in AI service:", error)
    throw error
  }
}
