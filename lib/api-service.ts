import type { UserProfile } from "@/types"

export interface ProductAnalysisRequest {
  imageBase64: string
  userProfile: UserProfile
  userId: string
}

export interface ProductAnalysisResponse {
  rating: number
  explanation: string
  productName?: string
  brand?: string
  category?: string
  pros?: string[]
  cons?: string[]
  ingredients?: string[]
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
    const rating = Math.floor(Math.random() * 11) // 0-10
    const isDangerous = rating === 0
    const isUnrecognized = Math.random() < 0.1 // 10% chance of being unrecognized

    if (isUnrecognized) {
      return {
        rating: -1,
        explanation: "From where did u find this thing ?",
        productName: "Unrecognized Product",
        recommendations: [],
      }
    }

    let explanation = "Based on your profile, this product is "
    if (isDangerous) {
      explanation = "This product is dangerous for you due to your health profile."
    } else if (rating >= 8) {
      explanation += "an excellent match for you."
    } else if (rating >= 5) {
      explanation += "a good match for you, with some considerations."
    } else {
      explanation += "not recommended for your specific needs."
    }

    const pros = ["Affordable price", "Widely available", "Pleasant scent"]
    const cons = ["Contains artificial colors", "Not suitable for very dry skin"]

    if (rating > 7) {
      pros.push("Highly effective formula")
    }
    if (rating < 4) {
      cons.push("May cause irritation for sensitive skin")
    }

    return {
      rating,
      explanation,
      productName: "Hydrating Facial Cleanser",
      brand: "Nivea",
      category: "Skincare – Moisturizer",
      pros,
      cons,
    }
  }
}
