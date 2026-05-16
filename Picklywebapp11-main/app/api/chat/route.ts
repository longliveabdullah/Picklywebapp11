// Unified Pickly chat (standalone assistant + product Q&A from scan). Edge streaming via OpenRouter.
import { type NextRequest } from "next/server"
import { picklyModelId } from "@/lib/pickly-analyze/constants"
import { createOpenRouterClient } from "@/lib/openrouter-client"
import type { ProductRating } from "@/types"

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp?: Date
}

const GENERAL_ASSISTANT_SYSTEM = `You are Pickly — a friendly, knowledgeable beauty and skincare assistant.
You help users with:
- Understanding product ingredients and what they do
- Building skincare, haircare, and beauty routines
- Finding cleaner or better alternatives to products
- Answering questions about skin types, concerns, and treatments
- Explaining cosmetic science in simple terms

Keep answers concise (2-4 short paragraphs max), warm, and practical.
Use simple language. Never mention you are an AI. You are Pickly.`

function buildProductSystemPrompt(productData: ProductRating): string {
  return `You are Pickly - a friendly and helpful product analysis assistant.
Use this product data to answer the user's questions:
- Name: ${productData.productName}
- Rating: ${productData.rating}/10
- Summary: ${productData.summary}
- Key Pros: ${(productData.reasonsToBuy || []).join(", ")}
- Key Cons: ${(productData.reasonsToAvoid || []).join(", ")}
Answer questions concisely and helpfully based on this data. Do not mention that you are an AI.`
}

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, productData } = body as {
      messages?: ChatMessage[]
      productData?: ProductRating | null
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const systemMessage =
      productData != null && typeof productData === "object"
        ? { role: "system" as const, content: buildProductSystemPrompt(productData) }
        : { role: "system" as const, content: GENERAL_ASSISTANT_SYSTEM }

    const transformedMessages = messages.map((message: ChatMessage) => ({
      role: message.isUser ? ("user" as const) : ("assistant" as const),
      content: message.content,
    }))

    const openai = createOpenRouterClient()
    const response = await openai.chat.completions.create({
      model: picklyModelId(),
      messages: [systemMessage, ...transformedMessages],
      temperature: 0.7,
      max_tokens: productData != null ? 500 : 600,
      stream: true,
    })

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ""
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    console.error("Chat API error:", err)
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: "Failed to get chat response", details: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
