import OpenAI from "openai"
import { picklyModelId } from "@/lib/pickly-analyze/constants"
import { tryParseAnalyzeBody } from "@/lib/pickly-analyze/json-parse"
import type { AnalyzeRequestMode } from "@/lib/pickly-analyze/schema"
import { buildSystemPrompt, buildUserPrompt } from "@/lib/pickly-analyze/prompts"

export type VisionAnalyzeArgs = {
  imageBase64: string
  depth: AnalyzeRequestMode
  language: "en" | "tr"
  displayName?: string | null
  profileBlock: string
  shelfBlock: string
  routineBlock: string
  scansBlock: string
  futureBuysBlock: string
  pastDecisionsBlock: string
  maxTokens: number
}

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

export async function runVisionAnalyze(client: OpenAI, args: VisionAnalyzeArgs): Promise<string | null> {
  const model = picklyModelId()

  const userPrompt = buildUserPrompt({
    language: args.language,
    displayName: args.displayName,
    profileBlock: args.profileBlock,
    shelfBlock: args.shelfBlock,
    routineBlock: args.routineBlock,
    scansBlock: args.scansBlock,
    futureBuysBlock: args.futureBuysBlock,
    pastDecisionsBlock: args.pastDecisionsBlock,
    depth: args.depth,
  })

  const completion = await client.chat.completions.create({
    model,
    temperature: args.depth === "in_store" ? 0.25 : 0.35,
    max_tokens: args.maxTokens,
    messages: [
      { role: "system", content: buildSystemPrompt(args.depth) },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${args.imageBase64}` },
          },
        ],
      },
    ],
  })

  const content = completion.choices[0]?.message?.content ?? null
  return typeof content === "string" ? content : null
}

export async function runRepairJson(client: OpenAI, brokenRaw: string): Promise<string | null> {
  const model = picklyModelId()
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 2800,
    messages: [
      {
        role: "system",
        content:
          "You repair malformed JSON. Output VALID JSON ONLY matching Pickly analyze schema keys from instructions — no markdown.",
      },
      {
        role: "user",
        content: `Fix this into valid JSON with required keys:\n${brokenRaw.slice(0, 12000)}`,
      },
    ],
  })

  const content = completion.choices[0]?.message?.content ?? null
  return typeof content === "string" ? content : null
}

export function parseBodyFromContent(raw: string | null) {
  if (!raw) return null
  return tryParseAnalyzeBody(raw)
}
