const DISPLAY_NAME_PREFIX = "pickly-display-name"
const MAX_DISPLAY_NAME_LENGTH = 50

export function getDisplayNameStorageKey(userId: string) {
  return `${DISPLAY_NAME_PREFIX}:${userId}`
}

export function getDefaultDisplayName(email?: string | null, userId?: string) {
  if (email) {
    const fromEmail = email.split("@")[0]
    if (fromEmail) return fromEmail
  }
  if (userId) return `User_${userId.slice(0, 5)}`
  return "User"
}

export function readStoredDisplayName(userId: string): string | null {
  if (typeof window === "undefined") return null
  const value = window.localStorage.getItem(getDisplayNameStorageKey(userId))
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function writeStoredDisplayName(userId: string, name: string) {
  const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
  if (!trimmed) return
  window.localStorage.setItem(getDisplayNameStorageKey(userId), trimmed)
}

export { MAX_DISPLAY_NAME_LENGTH }
