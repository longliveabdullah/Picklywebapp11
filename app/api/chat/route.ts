// app/api/chat/route.ts (edge) - Final robust implementation without 'ai' package for response
import { type NextRequest } from "next/server";
import OpenAI from "openai";
// No more 'ai' package imports for streaming!
import type { ProductRating } from "@/types";

// Define the expected frontend message structure
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "Pickly - AI Product Analyzer",
  },
});

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { messages, productData } = await request.json();

    if (!messages || !Array.isArray(messages) || !productData) {
      return new Response(
        JSON.stringify({ error: "Missing messages or productData" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemMessage = {
      role: "system",
      content: `You are Pickly - a friendly and helpful product analysis assistant.
      Use this product data to answer the user's questions:
      - Name: ${productData.productName}
      - Rating: ${productData.rating}/10
      - Summary: ${productData.summary}
      - Key Pros: ${(productData.reasonsToBuy || []).join(", ")}
      - Key Cons: ${(productData.reasonsToAvoid || []).join(", ")}
      Answer questions concisely and helpfully based on this data. Do not mention that you are an AI.
      `,
    };

    const transformedMessages = messages.map((message: ChatMessage) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.content,
    }));

    const finalMessages = [systemMessage, ...transformedMessages];

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: finalMessages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    console.error("Chat API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Failed to get chat response", details: msg }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
