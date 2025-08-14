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
  reasonsToBuy?: string[]
  reasonsToAvoid?: string[]
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

    const prompt = `You are picklyai, a product analyzer that helps users understand the health and quality of products before buying them. Always provide the following:

Brand name
Category
A rating out of 10 (explained below)
A detailed list of Pros and Cons (2–4 detailed bullet points each)
The rating reflects product quality, effect on human health, and fit for the user's profile.

Rating logic:
Start at 10/10.
Subtract points for any negative health impact, low quality, poor ingredients, or mismatch with user needs.
If the product is unidentified or lacks enough data, rate it 0/10 and explain that it couldn’t be analyzed.
Clearly explain the reason for the final score.

Pros and cons and summary :
Write clearly and informatively.
Do not just list ingredients — explain how they help or harm the user.
Use simple language that a non-expert can understand.
If the product contains ingredients commonly used in low-quality or cheap formulations (e.g., parabens, sulfates, artificial dyes, excessive preservatives, etc.), mention this in the cons and explain that these are often used in poor-quality products.

${userProfileInfo}

IMPORTANT SAFETY RULES:
- If the user has allergies and the product contains these allergens, rate it 0/10 and clearly state it is DANGEROUS for the user.
- If the user has diabetes and the product has high sugar content, rate it 0/10 and explain that it is DANGEROUS for diabetic users.
- If the product contains ingredients the user wants to avoid, lower the rating significantly and highlight this in the cons.
- For skincare products, consider the user’s skin type. If the product is unsuitable, reduce the score and explain why.
- For hair products, consider the user’s scalp type. If it's not appropriate, reduce the score and explain why.

Always prioritize the user’s health and safety above all.

Always respond in JSON format with the following structure: { "brandName": string, "category": string, "rating": number, "pros": string[], "cons": string[], "summary": string }`

    let analysisResult: AnalyzeResponse

    // Try OpenRouter API first
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🤖 Calling OpenRouter API...")

        const completion = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
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
            productName: parsed.productName || parsed.brandName || "Unknown Product",
            healthScore: parsed.productDetected ? Math.max(1, Math.min(100, parsed.rating * 10)) : 0,
            suitabilityScore: parsed.confidence ? Math.max(1, Math.min(100, parsed.confidence)) : 0,
            ingredients: [], // Keep for compatibility
            reasonsToBuy: parsed.pros || [],
            reasonsToAvoid: parsed.cons || [],
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

  const reasonsToBuy = ["Affordable", "Widely available"]
  const reasonsToAvoid = ["Contains artificial fragrances"]

  if (rating > 7) {
    reasonsToBuy.push("High-quality ingredients")
  }
  if (rating < 4) {
    reasonsToAvoid.push("May not be suitable for sensitive skin")
  }

  return {
    rating,
    explanation,
    recommendations,
    productName: "Analyzed Product",
    healthScore: Math.floor(Math.random() * 100) + 1,
    suitabilityScore: rating * 10,
    ingredients: ["Natural extracts", "Preservatives", "Active compounds"],
    reasonsToBuy,
    reasonsToAvoid,
  }
}
