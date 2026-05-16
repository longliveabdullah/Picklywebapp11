"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"

const ease = [0.22, 1, 0.36, 1] as const
const LANGUAGE_KEY = "pickly-language"
const NOTIFICATIONS_KEY = "pickly-notifications-enabled"

type Language = "en" | "tr"

const quickLinks = [
  {
    label: "Profile",
    description: "Edit your profile, routine preview, and social identity.",
    href: "/profile",
  },
  {
    label: "My Shelf",
    description: "Manage products, prices, categories, and perfume slots.",
    href: "/products",
  },
  {
    label: "Wallet",
    description: "Review spend insights powered by your shelf data.",
    href: "/wallet",
  },
  {
    label: "Pickly Assistant",
    description: "Ask about ingredients, routines, and better alternatives.",
    href: "/assistant",
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<Language>("en")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY) as Language | null
    const savedNotifications = window.localStorage.getItem(NOTIFICATIONS_KEY)

    if (savedLanguage === "en" || savedLanguage === "tr") {
      setLanguage(savedLanguage)
    }

    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === "true")
    }
  }, [])

  const updateLanguage = (value: Language) => {
    setLanguage(value)
    window.localStorage.setItem(LANGUAGE_KEY, value)
  }

  const updateNotifications = (value: boolean) => {
    setNotificationsEnabled(value)
    window.localStorage.setItem(NOTIFICATIONS_KEY, String(value))
  }

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-[#F5EFE6] pb-24">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-5 pb-3 pt-5"
        >
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h1 className="text-lg font-bold text-[#2D2D2D]">App Settings</h1>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#697254]/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
        </motion.div>

        <div className="space-y-4 px-5 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease }}
            className="rounded-3xl bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Preferences</p>

            <div className="mt-4 rounded-2xl bg-[#F5EFE6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#2D2D2D]">Language</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/65">
                    Choose your app language.
                  </p>
                </div>

                <div className="flex rounded-full bg-white p-1 shadow-sm">
                  {[
                    { id: "en", label: "English" },
                    { id: "tr", label: "Turkish" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateLanguage(option.id as Language)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        language === option.id
                          ? "bg-[#697254] text-[#EFE5D8]"
                          : "text-[#92735C]/65"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-[#F5EFE6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#2D2D2D]">Notifications</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/65">
                    Control product reminders and app alerts.
                  </p>
                </div>

                <div className="flex rounded-full bg-white p-1 shadow-sm">
                  {[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => updateNotifications(option.value)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        notificationsEnabled === option.value
                          ? "bg-[#697254] text-[#EFE5D8]"
                          : "text-[#92735C]/65"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease }}
            className="rounded-3xl bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Quick Access</p>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#697254]/55">
                Navigation
              </span>
            </div>

            <div className="space-y-2.5">
              {quickLinks.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#F5EFE6] p-4 text-left transition-colors hover:bg-[#EFE7DB]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#2D2D2D]">{item.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#92735C]/65">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease }}
            className="rounded-3xl bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Legal</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/legal/terms")}
                className="rounded-full bg-[#F5EFE6] px-4 py-2 text-[12px] font-semibold text-[#697254] transition-colors hover:bg-[#EFE7DB]"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => router.push("/legal/privacy")}
                className="rounded-full bg-[#F5EFE6] px-4 py-2 text-[12px] font-semibold text-[#697254] transition-colors hover:bg-[#EFE7DB]"
              >
                Privacy Policy
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="rounded-3xl bg-[#697254] p-5 text-[#EFE5D8] shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7AD89]">Pickly</p>
            <p className="mt-2 text-base font-bold">Beauty settings, without the clutter.</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#EFE5D8]/75">
              Keep language, notifications, and your main app flows in one calm place.
            </p>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
