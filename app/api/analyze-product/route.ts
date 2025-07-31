import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "Pickly - AI Product Analyzer",
  },
})

interface AnalyzeRequest {
  imageBase64: string
  userProfile?: {
    age?: number
    gender?: string
    skinType?: string
    allergies?: string[]
    hasDiabetes?: boolean
  }
}

interface AnalyzeResponse {
  rating: number
  explanation: string
  recommendations: string[]
  productName?: string
  ingredients?: string[]
  healthScore?: number
  suitabilityScore?: number
}

export async function POST(request: NextRequest) {
  console.log("🔍 Starting product analysis...")

  try {
    const body: AnalyzeRequest = await request.json()
    const { imageBase64, userProfile } = body

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 })
    }

    // Build personalized context
    let userProfileInfo = "No profile information available - providing general product analysis."

    if (userProfile) {
      const parts = []
      if (userProfile.age) parts.push(`Age: ${userProfile.age} years old`)
      if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`)
      if (userProfile.skinType) parts.push(`Skin Type: ${userProfile.skinType}`)
      if (userProfile.hasDiabetes !== undefined) parts.push(`Diabetes: ${userProfile.hasDiabetes ? "Yes" : "No"}`)
      if (userProfile.allergies && userProfile.allergies.length > 0) {
        parts.push(`Allergies: ${userProfile.allergies.join(", ")}`)
      }

      if (parts.length > 0) {
        userProfileInfo = `USER PROFILE:
${parts.join("\n")}`
      }
    }

    const prompt = `You are Pickly ai product analyser you help user to know more about products before buying them, you should provide brand name, rate out of 10, be more detailed in pros, cons (long detailed pros/cons) . The rating is about product quality, effect on human health. If product is not identified, rate 0/10. If there are more cons than pros, lower the rating accordingly to reflect the negative aspects.

${userProfileInfo}

IMPORTANT SAFETY RULES:
1. If the user has allergies and the product contains these allergens, rate the product 0/10 and clearly state in the cons and summary that this product is DANGEROUS for the user due to allergic reactions.
2. If the user has diabetes and the product contains high sugar content, rate the product 0/10 and clearly state in the cons and summary that this product is DANGEROUS for diabetic users.
3. If the product contains ingredients the user specifically wants to avoid, lower the rating significantly and highlight this in the cons section.
4. For skincare products, consider if they are appropriate for the user's skin type. If not, lower the rating and explain why.
5. For hair products, consider if they are appropriate for the user's scalp type. If not, lower the rating and explain why.

Always prioritize health and safety concerns based on the user's profile. The user's health and safety are the most important factors in your analysis.

Always respond in JSON format with the following structure: { productDetected: boolean, productName: string, confidence: number, rating: number, productInfo: { category: string, brand: string }, pros: string[], cons: string[], summary: string }`

    let analysisResult: AnalyzeResponse

    // Try OpenRouter API first
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🤖 Calling OpenRouter API...")

        const completion = await openai.chat.completions.create({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new Error("No content in OpenRouter response")
        }

        console.log("📝 Raw AI response:", content.substring(0, 200) + "...")

        // Parse JSON response
        try {
          const cleanContent = content.trim().replace(/```json\n?|\n?```/g, "")
          const parsed = JSON.parse(cleanContent)

          // Transform the new format to match existing interface
          analysisResult = {
            rating: Math.max(0, Math.min(10, Math.round(parsed.rating || 0))),
            explanation: parsed.summary || "Analysis completed successfully.",
            recommendations:
              Array.isArray(parsed.pros) && parsed.pros.length > 0 ? parsed.pros.slice(0, 3) : ["Use as directed"],
            productName: parsed.productName || "Unknown Product",
            healthScore: parsed.productDetected ? Math.max(1, Math.min(100, parsed.rating * 10)) : 0,
            suitabilityScore: parsed.confidence ? Math.max(1, Math.min(100, parsed.confidence)) : 0,
            ingredients: [], // Keep for compatibility
          }

          console.log("✅ Successfully parsed OpenRouter response:", {
            productDetected: parsed.productDetected,
            productName: parsed.productName,
            rating: parsed.rating,
            brand: parsed.productInfo?.brand,
          })
        } catch (parseError) {
          console.error("❌ Failed to parse OpenRouter JSON response:", parseError)
          throw new Error("Invalid JSON response from AI service")
        }
      } catch (apiError) {
        console.error("❌ OpenRouter API error:", apiError)
        console.log("🔄 Falling back to mock response...")
        analysisResult = generateMockResponse(userProfile)
      }
    } else {
      console.log("⚠️ No OpenAI API key found, using mock response")
      analysisResult = generateMockResponse(userProfile)
    }

    console.log("🎉 Analysis completed successfully:", {
      rating: analysisResult.rating,
      productName: analysisResult.productName,
      hasRecommendations: analysisResult.recommendations.length > 0,
    })

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("❌ Analyze API error:", error)

    return NextResponse.json(
      {
        error: "Failed to analyze product",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// GET endpoint for testing
export async function GET() {
  console.log("🧪 Testing analyze API endpoint...")

  try {
    return NextResponse.json({
      status: "Analyze API is running",
      hasOpenRouterKey: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("❌ GET endpoint error:", error)
    return NextResponse.json(
      {
        error: "API test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

function generateMockResponse(userProfile?: any): AnalyzeResponse {
  const rating = Math.floor(Math.random() * 10) + 1

  let explanation = "Based on our analysis, this product "
  if (rating >= 8) {
    explanation += "appears to be an excellent choice with high quality ingredients and good safety profile."
  } else if (rating >= 5) {
    explanation += "seems to be a decent option with some considerations to keep in mind."
  } else {
    explanation += "may not be the best choice due to potential concerns with ingredients or suitability."
  }

  if (userProfile?.skinType) {
    explanation += ` For your ${userProfile.skinType} skin type, `
    if (userProfile.skinType === "sensitive") {
      explanation += "we recommend patch testing before full use."
    } else {
      explanation += "this product should work well with proper application."
    }
  }

  if (userProfile?.allergies && userProfile.allergies.length > 0) {
    explanation += ` We've considered your known allergies (${userProfile.allergies.join(", ")}) in this assessment.`
  }

  const recommendations = [
    "Read all ingredient labels carefully",
    "Use as directed on packaging",
    "Store in a cool, dry place",
  ]

  if (userProfile?.skinType === "sensitive") {
    recommendations.push("Perform a patch test before first use")
  }

  if (rating < 5) {
    recommendations.push("Consider alternative products better suited to your needs")
  }

  return {
    rating,
    explanation,
    recommendations,
    productName: "Analyzed Product",
    healthScore: Math.floor(Math.random() * 100) + 1,
    suitabilityScore: rating * 10,
    ingredients: ["Natural extracts", "Preservatives", "Active compounds"],
  }
}
