"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const categories = [
  {
    id: "skincare",
    label: "Skincare",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6C20 6 16 6 16 10V14H24V10C24 6 20 6 20 6Z" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="14" y="14" width="12" height="20" rx="3" stroke="#8C916C" strokeWidth="1.8" fill="none"/>
        <path d="M14 20H26" stroke="#8C916C" strokeWidth="1.2"/>
        <circle cx="20" cy="27" r="2.5" stroke="#8C916C" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    id: "makeup",
    label: "Makeup",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 8H24L26 16H14L16 8Z" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="13" y="16" width="14" height="16" rx="3" stroke="#8C916C" strokeWidth="1.8" fill="none"/>
        <path d="M17 22H23" stroke="#8C916C" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M17 26H23" stroke="#8C916C" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "haircare",
    label: "Haircare",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 10C15 10 14 14 14 18C14 22 16 24 20 24C24 24 26 22 26 18C26 14 25 10 25 10" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M18 24V32" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M22 24V32" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 32H25" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M20 10V6" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M17 11L15 8" stroke="#8C916C" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M23 11L25 8" stroke="#8C916C" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "fragrance",
    label: "Fragrance",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="16" width="10" height="16" rx="2" stroke="#8C916C" strokeWidth="1.8" fill="none"/>
        <path d="M18 16V12H22V16" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M20 12V8" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 8H24" stroke="#8C916C" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M25 20L28 18" stroke="#8C916C" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M25 24L27 24" stroke="#8C916C" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="20" cy="24" r="2" stroke="#8C916C" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function OnboardingCategoriesPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    router.push("/onboarding/gender")
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center pb-6 pt-12">
      {/* Top section */}
      <div className="flex flex-col items-center">
        {/* Step Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4"
        >
          <span className="inline-block rounded-full bg-[#A7AD89] px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
            Step 1
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2 text-center"
        >
          <h1 className="text-[22px] font-bold leading-snug text-[#2D2D2D]">
            Pickly helps you avoid
            <br />
            bad product decisions
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-center text-sm font-medium text-[#4A4A4A]"
        >
          What do you usually shop for?
        </motion.p>
      </div>

      {/* Category Grid — fills the middle */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="my-auto grid w-full grid-cols-2 gap-3"
      >
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.id)
          return (
            <motion.button
              key={cat.id}
              variants={itemVariants}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleCategory(cat.id)}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[#A7AD89] bg-[#D5DBC3] shadow-md"
                  : "border-transparent bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                  isSelected ? "bg-[#A7AD89]/35" : "bg-[#A7AD89]/10"
                }`}
              >
                {cat.icon}
              </div>
              <span
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isSelected ? "text-[#3D4A30]" : "text-[#3D3D3D]"
                }`}
              >
                {cat.label}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Bottom section — pinned to the bottom */}
      <div className="mt-auto flex w-full flex-col items-center pt-6">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={selected.length === 0}
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#697254] py-4 text-base font-semibold text-[#EFE5D8] shadow-lg transition-all duration-200 disabled:opacity-40"
        >
          Next
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 4L13.5 10L7.5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-xs font-medium tracking-widest text-[#92735C]/60"
        >
          STEP 1 OF 3
        </motion.p>
      </div>
    </div>
  )
}
