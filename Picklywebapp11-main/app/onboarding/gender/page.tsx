"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { updateOnboardingProfileDraft } from "@/lib/onboarding-profile-storage"

const priorities = [
  {
    id: "quality",
    label: "Quality",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L14.09 8.26L20.18 8.63L15.46 12.97L17.09 19.02L12 15.77L6.91 19.02L8.54 12.97L3.82 8.63L9.91 8.26L12 2Z"/>
      </svg>
    ),
  },
  {
    id: "price",
    label: "Price",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <circle cx="7" cy="7" r="1"/>
      </svg>
    ),
  },
  {
    id: "ingredients",
    label: "Ingredients",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2 2.1 4.9A7 7 0 0111 20z"/>
        <path d="M11 13V20"/>
        <path d="M11 13C11 13 8 11 7 8"/>
      </svg>
    ),
  },
  {
    id: "long-term-value",
    label: "Long-term value",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    id: "brand-trust",
    label: "Brand trust",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    id: "performance",
    label: "Performance",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    id: "sensitive-skin-safety",
    label: "Sensitive skin safety",
    span: "full" as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    id: "durability",
    label: "Durability",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73L13 2.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    id: "trendiness",
    label: "Trendiness",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L14.5 8.5L20.5 9.3L16.2 13.4L17.3 19.3L12 16.5L6.7 19.3L7.8 13.4L3.5 9.3L9.5 8.5L12 3Z"/>
      </svg>
    ),
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
}

const MIN_SELECT = 2
const MAX_SELECT = 5

export default function OnboardingPrioritiesPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  const togglePriority = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((p) => p !== id)
        updateOnboardingProfileDraft({ purchasePriorities: next })
        return next
      }
      if (prev.length >= MAX_SELECT) return prev
      const next = [...prev, id]
      updateOnboardingProfileDraft({ purchasePriorities: next })
      return next
    })
  }

  const handleNext = () => {
    router.push("/onboarding/height")
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center pb-6 pt-12">
      {/* Header */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2 text-center"
        >
          <h1 className="text-[22px] font-bold leading-snug text-[#EFE5D8]">
            When buying products,
            <br />
            what matters to you
            <br />
            most?
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 text-center text-sm font-medium text-[#DBD0C4]/70"
        >
          Select {MIN_SELECT}-{MAX_SELECT} options
        </motion.p>
      </div>

      {/* Options Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="my-auto grid w-full grid-cols-2 gap-2.5"
      >
        {priorities.map((item) => {
          const isSelected = selected.includes(item.id)
          const isFull = "span" in item && item.span === "full"

          return (
            <motion.button
              key={item.id}
              variants={itemVariants}
              whileTap={{ scale: 0.96 }}
              onClick={() => togglePriority(item.id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-200 ${
                isFull ? "col-span-2" : ""
              } ${
                isSelected
                  ? "bg-[#A7AD89]/40 ring-1 ring-[#A7AD89]/60"
                  : "bg-[#697254]/50 ring-1 ring-white/[0.06]"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  isSelected
                    ? "bg-[#EFE5D8]/25 text-[#EFE5D8]"
                    : "bg-[#8C916C]/30 text-[#DBD0C4]/70"
                }`}
              >
                {item.icon}
              </div>

              <span
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isSelected ? "text-[#EFE5D8]" : "text-[#DBD0C4]/80"
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Bottom */}
      <div className="mt-auto flex w-full flex-col items-center pt-5">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={selected.length < MIN_SELECT}
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#DBD0C4] py-4 text-base font-semibold text-[#4D5A3C] shadow-lg transition-all duration-200 disabled:opacity-40"
        >
          Next
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="text-xs font-medium tracking-widest text-[#DBD0C4]/35"
        >
          STEP 2 OF 3
        </motion.p>
      </div>
    </div>
  )
}
