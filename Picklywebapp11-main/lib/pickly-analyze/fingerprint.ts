const PUNCT_RE = /[^\p{L}\p{N}\s]/gu

export function normalizeProductName(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(PUNCT_RE, "")
    .replace(/\s+/g, " ")
}

/** v1 fingerprint: category + normalized name (matches product spec). */
export function productFingerprint(category: string, productName: string): string {
  const c = normalizeProductName(category) || "unknown"
  const n = normalizeProductName(productName) || "unknown"
  return `${c}::${n}`
}

export function ingredientBlobToTokens(blob: string | null | undefined): string[] {
  if (!blob) return []
  return blob
    .split(/[,;]|(?:\s+-\s+)/g)
    .map((part) =>
      part
        .trim()
        .replace(/^\d+[\).\s]+\s*/, "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s%/.\-']/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
}
