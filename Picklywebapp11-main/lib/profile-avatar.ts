export const PROFILE_PICTURES_BUCKET = "profile-pictures"

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

export const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export function avatarStoragePath(userId: string, ext: string) {
  return `${userId}/avatar.${ext}`
}

export function publicAvatarUrl(supabaseUrl: string, path: string) {
  const base = supabaseUrl.replace(/\/$/, "")
  return `${base}/storage/v1/object/public/${PROFILE_PICTURES_BUCKET}/${path}`
}

export function extensionForMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    default:
      return null
  }
}

export function oauthAvatarFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null
  const candidates = [metadata.avatar_url, metadata.picture, metadata.photo]
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().startsWith("http")) {
      return value.trim()
    }
  }
  return null
}
