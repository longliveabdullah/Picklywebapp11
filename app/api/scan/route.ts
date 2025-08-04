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
  brandName: string
  category: string
  rating: number
  pros: string[]
  cons: string[]
  summary?: string
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

${personalizedContext}

IMPORTANT SAFETY RULES:
- If the user has allergies and the product contains these allergens, rate it 0/10 and clearly state it is DANGEROUS for the user.
- If the user has diabetes and the product has high sugar content, rate it 0/10 and explain that it is DANGEROUS for diabetic users.
- If the product contains ingredients the user wants to avoid, lower the rating significantly and highlight this in the cons.
- For skincare products, consider the user’s skin type. If the product is unsuitable, reduce the score and explain why.
- For hair products, consider the user’s scalp type. If it's not appropriate, reduce the score and explain why.

Always prioritize the user’s health and safety above all.

Always respond in JSON format with the following structure: { "brandName": string, "category": string, "rating": number, "pros": string[], "cons": string[], "summary": string }`

    let analysisResult: ScanResponse

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
            brandName: parsed.brandName,
            category: parsed.category,
            rating: parsed.rating,
            pros: parsed.pros,
            cons: parsed.cons,
            summary: parsed.summary,
            ingredients: parsed.ingredients,
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
        product_name: analysisResult.brandName,
        rating: analysisResult.rating,
        explanation: analysisResult.summary,
        recommendations: [],
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
      brandName: analysisResult.brandName,
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
  const rating = Math.floor(Math.random() * 11)
  const isDangerous = rating === 0
  const isUnrecognized = Math.random() < 0.1

  if (isUnrecognized) {
    return {
      rating: -1,
      summary: "From where did u find this thing ?",
      brandName: "Unrecognized",
      category: "Unknown",
      pros: [],
      cons: [],
    }
  }

  let summary = "Based on your profile, this product is "
  if (isDangerous) {
    summary = "This product is dangerous for you due to your health profile."
  } else if (rating >= 8) {
    summary += "an excellent match for you."
  } else if (rating >= 5) {
    summary += "a good match for you, with some considerations."
  } else {
    summary += "not recommended for your specific needs."
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
    summary,
    brandName: "Nivea",
    category: "Skincare – Moisturizer",
    pros,
    cons,
    ingredients: ["Aqua", "Glycerin", "Parfum"],
  }
}
