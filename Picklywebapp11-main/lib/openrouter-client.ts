import OpenAI from "openai"

/** Shared OpenRouter client for Pickly (analyze, chat, assistant). */
export function createOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY or OPENROUTER_API_KEY")
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Pickly Product Analyzer",
    },
  })
}
