/** Resolve a display name from profile row, OAuth metadata, or email. */
export function resolveDisplayName(options: {
  profileDisplayName?: string | null
  metadata?: Record<string, unknown> | null
  email?: string | null
  userId?: string
}): string | null {
  const fromProfile = options.profileDisplayName?.trim()
  if (fromProfile) return fromProfile

  const meta = options.metadata
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    null
  if (fromMeta) return fromMeta

  if (options.email) {
    const fromEmail = options.email.split("@")[0]?.trim()
    if (fromEmail) return fromEmail
  }

  if (options.userId) return `User_${options.userId.slice(0, 5)}`
  return null
}
