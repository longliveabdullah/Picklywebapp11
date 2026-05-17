"use client"

import type React from "react"
import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import i18n, { changeAppLocale } from "@/lib/i18n"
import { getStoredLocale, isAppLocale, setStoredLocale, type AppLocale } from "@/lib/i18n/locale"
import { useAuth } from "@/contexts/auth-context"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    const profileLocale = user?.profile?.locale
    const locale: AppLocale = isAppLocale(profileLocale) ? profileLocale : getStoredLocale()

    if (isAppLocale(profileLocale) && profileLocale !== getStoredLocale()) {
      setStoredLocale(profileLocale)
    }

    void changeAppLocale(locale)
  }, [user?.id, user?.profile?.locale])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
