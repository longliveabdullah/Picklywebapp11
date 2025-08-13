// app/api/chat/route.ts (edge) — drop-in replacement
import { type NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { message, productRating } = await request.json();

    if (!message || !productRating) {
      return new Response(JSON.stringify({ error: "Missing message or productRating" }), { status: 400 });
    }

    const context = `
      Product Name: ${productRating.productName}
      Rating: ${productRating.rating}/10
      Summary: ${productRating.summary}
      Explanation: ${productRating.explanation}
      ReasonsToBuy: ${(productRating.reasonsToBuy || []).join(", ")}
      ReasonsToAvoid: ${(productRating.reasonsToAvoid || []).join(", ")}
    `;

    const prompt = `You are Pickly. Answer the user's question concisely and helpfully.

User's question: ${message}

Product Data:
${context}`;

    const body = JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("OpenRouter non-OK:", res.status, txt);
      return new Response(JSON.stringify({ error: "OpenRouter error", details: txt }), { status: 502 });
    }

    const stream = await OpenAIStream(res); // pass the raw fetch Response
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error("Chat API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: "Failed to get chat response", details: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
