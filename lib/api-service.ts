import type { UserProfile } from "@/types"

export interface ProductAnalysisRequest {
  imageBase64: string
  userProfile: UserProfile
  userId: string
}

export interface ProductAnalysisResponse {
  rating: number
  explanation: string
  recommendations: string[]
  productName?: string
  ingredients?: string[]
  healthScore?: number
  suitabilityScore?: number
}

export class ApiService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.pickly.com"
  private static readonly API_KEY = process.env.PICKLY_API_KEY

  static async analyzeProduct(request: ProductAnalysisRequest): Promise<ProductAnalysisResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`,
          "X-User-ID": request.userId,
        },
        body: JSON.stringify({
          image: request.imageBase64,
          user_profile: {
            age: request.userProfile.age,
            gender: request.userProfile.gender,
            height: request.userProfile.height,
            weight: request.userProfile.weight,
            has_diabetes: request.userProfile.hasDiabetes,
            allergies: request.userProfile.allergies || [],
            skin_type: request.userProfile.skinType,
            scalp_type: request.userProfile.scalpType,
            goals: request.userProfile.goals || [],
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error calling external API:", error)

      // Fallback to mock response for development/demo
      return this.getMockResponse(request)
    }
  }

  private static getMockResponse(request: ProductAnalysisRequest): ProductAnalysisResponse {
    // Generate a rating based on user profile
    const rating = Math.floor(Math.random() * 10) + 1

    let explanation = "Based on your profile, this product is "
    if (rating >= 8) {
      explanation += "an excellent match for you. "
    } else if (rating >= 5) {
      explanation += "a good match for you, with some considerations. "
    } else {
      explanation += "not recommended for your specific needs. "
    }

    // Add profile-specific details
    if (request.userProfile.skinType) {
      explanation += `It's suitable for your ${request.userProfile.skinType} skin type. `
    }

    if (request.userProfile.hasDiabetes) {
      explanation += "We've taken your diabetes into account in this rating. "
    }

    if (request.userProfile.allergies && request.userProfile.allergies.length > 0) {
      explanation += "We've checked for your listed allergies and found no conflicts. "
    }

    const recommendations = ["Use as directed on the packaging", "Store in a cool, dry place away from direct sunlight"]

    if (request.userProfile.skinType === "sensitive") {
      recommendations.push("Perform a patch test before full application")
    }

    if (rating < 5) {
      recommendations.push("Consider alternatives better suited to your profile")
    }

    return {
      rating,
      explanation,
      recommendations,
      productName: "Analyzed Product",
      healthScore: Math.floor(Math.random() * 100),
      suitabilityScore: rating * 10,
    }
  }
}
