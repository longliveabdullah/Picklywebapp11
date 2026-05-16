export const PICKLY_PROMPT_VERSION = "pickly_analyze_v1"

/** OpenRouter-compatible model ID — override via env */
export function picklyModelId(): string {
  return process.env.PICKLY_OPENROUTER_MODEL?.trim() || "openai/gpt-4.1-mini"
}

export const CONTEXT_CAPS = {
  shelfMax: 8,
  scansMax: 5,
  pastDecisionsMax: 12,
  quickPromptsCount: 3,
  inStoreWhyMax: 2,
} as const
