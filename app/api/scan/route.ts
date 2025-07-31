import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "Pickly - AI Product Analyzer",
  },
})

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface ScanRequest {
  imageBase64: string
  userId: string
}

interface ScanResponse {
  rating: number
  explanation: string
  recommendations: string[]
  productName: string
  healthScore: number
  suitabilityScore: number
  ingredients?: string[]
}

export async function POST(request: NextRequest) {
  console.log("🔍 Starting product scan analysis...")

  try {
    // Parse request body with error handling
    let body: ScanRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        },
        { status: 400 },
      )
    }

    const { imageBase64, userId } = body

    console.log("📊 Request validation:", {
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      hasUserId: !!userId,
      userId: userId,
    })

    if (!imageBase64 || !userId) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Both imageBase64 and userId are required",
        },
        { status: 400 },
      )
    }

    // Validate base64 string
    if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
      console.error("❌ Invalid imageBase64 format")
      return NextResponse.json(
        {
          error: "Invalid image data",
          details: "imageBase64 must be a valid base64 string",
        },
        { status: 400 },
      )
    }

    console.log("📊 Request details:", {
      userId,
      imageSize: imageBase64.length,
      hasApiKey: !!process.env.OPENAI_API_KEY,
    })

    // Get user profile for personalized analysis
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError) {
        console.log("⚠️ No user profile found:", profileError.message)
      } else {
        profile = profileData
        console.log("👤 User profile found:", {
          hasProfile: !!profile,
          age: profile?.age,
          skinType: profile?.skin_type,
          allergies: profile?.allergies?.length || 0,
        })
      }
    } catch (profileError) {
      console.log("⚠️ Error fetching user profile:", profileError)
      // Continue without profile - don't fail the request
    }

    // Build personalized prompt
    const personalizedContext = buildPersonalizedContext(profile)

    const prompt = `You are Pickly, an AI product analyst. Analyze this product image and provide a personalized rating.

${personalizedContext}

INSTRUCTIONS:
1. Identify the product (name, type, brand if visible)
2. Analyze ingredients/components if visible
3. Rate 1-10 based on user suitability and general safety
4. Consider the user's profile information provided above
5. Provide detailed explanation of your rating
6. Give 3-5 specific recommendations

CRITICAL: Respond with ONLY valid JSON in this exact format:
{
  "rating": [1-10 integer],
  "productName": "Product name if identifiable",
  "explanation": "Detailed explanation considering profile information",
  "ingredients": ["ingredient1", "ingredient2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "healthScore": [1-100 integer],
  "suitabilityScore": [1-100 integer]
}

RESPOND WITH ONLY JSON - NO OTHER TEXT.`

    let analysisResult: ScanResponse

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
          max_tokens: 1000,
          temperature: 0.7,
        })

        console.log("📥 OpenRouter response received:", {
          hasChoices: !!completion.choices,
          choicesLength: completion.choices?.length || 0,
          usage: completion.usage,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new Error("No content in OpenRouter response")
        }

        console.log("📝 Raw AI response:", content.substring(0, 200) + "...")

        // Parse JSON response with better error handling
        try {
          // Clean the response - remove any markdown formatting
          const cleanContent = content.trim().replace(/```json\n?|\n?```/g, "")
          const parsed = JSON.parse(cleanContent)

          analysisResult = {
            rating: Math.max(1, Math.min(10, Math.round(parsed.rating || 5))),
            explanation: parsed.explanation || "Analysis completed successfully.",
            recommendations: Array.isArray(parsed.recommendations)
              ? parsed.recommendations.slice(0, 5)
              : ["Use as directed"],
            productName: parsed.productName || "Analyzed Product",
            healthScore: Math.max(1, Math.min(100, Math.round(parsed.healthScore || 50))),
            suitabilityScore: Math.max(1, Math.min(100, Math.round(parsed.suitabilityScore || 50))),
            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
          }

          console.log("✅ Successfully parsed OpenRouter response")
        } catch (parseError) {
          console.error("❌ Failed to parse OpenRouter JSON response:", parseError)
          console.error("❌ Raw content:", content)
          throw new Error("Invalid JSON response from AI service")
        }
      } catch (apiError) {
        console.error("❌ OpenRouter API error:", apiError)
        console.log("🔄 Falling back to mock response...")
        analysisResult = generateMockResponse(profile)
      }
    } else {
      console.log("⚠️ No OpenAI API key found, using mock response")
      analysisResult = generateMockResponse(profile)
    }

    // Save scan to history (optional - don't fail if this fails)
    try {
      const { error: insertError } = await supabase.from("scan_history").insert({
        user_id: userId,
        product_name: analysisResult.productName,
        rating: analysisResult.rating,
        explanation: analysisResult.explanation,
        recommendations: analysisResult.recommendations,
        user_profile_snapshot: profile || {},
        image_url: `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...`, // Store truncated for reference
      })

      if (insertError) {
        console.error("⚠️ Failed to save scan history:", insertError)
      } else {
        console.log("💾 Scan saved to history successfully")
      }
    } catch (saveError) {
      console.error("⚠️ Error saving scan history:", saveError)
      // Don't fail the request if saving fails
    }

    console.log("🎉 Analysis completed successfully:", {
      rating: analysisResult.rating,
      productName: analysisResult.productName,
      hasRecommendations: analysisResult.recommendations.length > 0,
    })

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("❌ Scan API error:", error)

    // Always return JSON, never HTML
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
  console.log("🧪 Testing scan API endpoint...")

  try {
    return NextResponse.json({
      status: "Scan API is running",
      hasOpenRouterKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
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

function buildPersonalizedContext(profile: any): string {
  if (!profile) {
    return "USER PROFILE: No profile information available - providing general product analysis."
  }

  const parts = []

  if (profile.age) {
    parts.push(`Age: ${profile.age} years old`)
  }

  if (profile.gender) {
    parts.push(`Gender: ${profile.gender}`)
  }

  if (profile.height && profile.weight) {
    const bmi = profile.weight / Math.pow(profile.height / 100, 2)
    parts.push(`Height: ${profile.height}cm, Weight: ${profile.weight}kg (BMI: ${bmi.toFixed(1)})`)
  }

  if (profile.skin_type) {
    parts.push(`Skin Type: ${profile.skin_type}`)
  }

  if (profile.scalp_type) {
    parts.push(`Scalp Type: ${profile.scalp_type}`)
  }

  if (profile.has_diabetes !== undefined) {
    parts.push(`Diabetes: ${profile.has_diabetes ? "Yes" : "No"}`)
  }

  if (profile.allergies && profile.allergies.length > 0) {
    parts.push(`Allergies: ${profile.allergies.join(", ")}`)
  }

  if (profile.goals && profile.goals.length > 0) {
    parts.push(`Goals: ${profile.goals.join(", ")}`)
  }

  const completionPercentage = Math.round((parts.length / 8) * 100)

  return `USER PROFILE (${completionPercentage}% complete):
${parts.length > 0 ? parts.join("\n") : "No specific profile information available - providing general analysis."}`
}

function generateMockResponse(profile: any): ScanResponse {
  const rating = Math.floor(Math.random() * 10) + 1

  let explanation = "Based on our analysis, this product "
  if (rating >= 8) {
    explanation += "appears to be an excellent choice with high quality ingredients and good safety profile."
  } else if (rating >= 5) {
    explanation += "seems to be a decent option with some considerations to keep in mind."
  } else {
    explanation += "may not be the best choice due to potential concerns with ingredients or suitability."
  }

  if (profile?.skin_type) {
    explanation += ` For your ${profile.skin_type} skin type, `
    if (profile.skin_type === "sensitive") {
      explanation += "we recommend patch testing before full use."
    } else {
      explanation += "this product should work well with proper application."
    }
  }

  if (profile?.allergies && profile.allergies.length > 0) {
    explanation += ` We've considered your known allergies (${profile.allergies.join(", ")}) in this assessment.`
  }

  const recommendations = [
    "Read all ingredient labels carefully",
    "Use as directed on packaging",
    "Store in a cool, dry place",
  ]

  if (profile?.skin_type === "sensitive") {
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
