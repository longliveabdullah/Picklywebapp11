import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import tr from "./locales/tr.json"
import { applyDocumentLocale, getStoredLocale, type AppLocale } from "./locale"

const resources = {
  en: { translation: en },
  tr: { translation: tr },
} as const

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: typeof window !== "undefined" ? getStoredLocale() : "en",
    fallbackLng: "en",
    supportedLngs: ["en", "tr"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

  if (typeof window !== "undefined") {
    applyDocumentLocale(getStoredLocale())
  }
}

export function getAppLocale(): AppLocale {
  const code = i18n.language?.split("-")[0]
  return code === "tr" ? "tr" : "en"
}

export async function changeAppLocale(locale: AppLocale) {
  await i18n.changeLanguage(locale)
  applyDocumentLocale(locale)
}

export default i18n
