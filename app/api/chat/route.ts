// app/api/chat/route.ts (edge) - Refactored for stateful conversation
import { type NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import type { ProductRating } from "@/types";

// Define the expected frontend message structure
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { messages, productData } = await request.json();

    // 1. Validate the incoming data
    if (!messages || !Array.isArray(messages) || !productData) {
      return new Response(
        JSON.stringify({ error: "Missing messages or productData" }),
        { status: 400 }
      );
    }

    // 2. Create the permanent system message with product context
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

    // 3. Transform the frontend message history to the OpenAI format
    const transformedMessages = messages.map((message: ChatMessage) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.content,
    }));

    // 4. Construct the final message array for the API call
    const finalMessages = [systemMessage, ...transformedMessages];

    // 5. Make the fetch call to OpenRouter
    const body = JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: finalMessages, // Use the new stateful message array
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Pickly - AI Product Analyzer",
      },
      body,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("OpenRouter non-OK:", res.status, txt);
      return new Response(
        JSON.stringify({ error: "OpenRouter error", details: txt }),
        { status: 502 }
      );
    }

    const stream = await OpenAIStream(res);
    return new StreamingTextResponse(stream);
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
