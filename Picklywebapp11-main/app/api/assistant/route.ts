import { type NextRequest } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
}

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
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemMessage = {
      role: "system",
      content: `You are Pickly — a friendly, knowledgeable beauty and skincare assistant.
You help users with:
- Understanding product ingredients and what they do
- Building skincare, haircare, and beauty routines
- Finding cleaner or better alternatives to products
- Answering questions about skin types, concerns, and treatments
- Explaining cosmetic science in simple terms

Keep answers concise (2-4 short paragraphs max), warm, and practical.
Use simple language. Never mention you are an AI. You are Pickly.`,
    };

    const transformedMessages = messages.map((msg: ChatMessage) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content,
    }));

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [systemMessage, ...transformedMessages],
      temperature: 0.7,
      max_tokens: 600,
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
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Assistant API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Failed to get response", details: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
