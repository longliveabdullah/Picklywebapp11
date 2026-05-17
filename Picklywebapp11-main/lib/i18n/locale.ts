export const LANGUAGE_KEY = "pickly-language"

export type AppLocale = "en" | "tr"

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "tr"
}

export function getStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en"
  const saved = window.localStorage.getItem(LANGUAGE_KEY)
  if (isAppLocale(saved)) return saved
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("tr")) {
    return "tr"
  }
  return "en"
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LANGUAGE_KEY, locale)
}

export function applyDocumentLocale(locale: AppLocale) {
  if (typeof document === "undefined") return
  document.documentElement.lang = locale
}
