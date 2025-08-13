import { type NextRequest } from "next/server"
import OpenAI from "openai"
import { OpenAIStream, StreamingTextResponse } from "ai"
import type { ProductRating } from "@/types"

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "Pickly - AI Product Analyzer",
  },
})

export const runtime = "edge"

interface ChatRequest {
  message: string
  productRating: ProductRating
}

export async function POST(request: NextRequest) {
  try {
    const { message, productRating }: ChatRequest = await request.json()

    if (!message || !productRating) {
      return new Response("Missing message or productRating", { status: 400 })
    }

    const { productName, rating, explanation, reasonsToBuy, reasonsToAvoid, summary } = productRating

    const context = `
      Product Name: ${productName}
      Rating: ${rating}/10
      Summary: ${summary}
      Explanation: ${explanation}
      Reasons to Buy: ${reasonsToBuy?.join(", ")}
      Reasons to Avoid: ${reasonsToAvoid?.join(", ")}
    `

    const prompt = `You are a helpful nutrition and product assistant named Pickly. Based on the following product analysis data, answer the user's question. Be concise, friendly, and helpful.

    Product Analysis Data:
    ${context}

    User's question:
    ${message}
    `

    const response = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free", // Using a fast model for chat
      stream: true,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Chat API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
    return new Response(JSON.stringify({ error: "Failed to get chat response", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
